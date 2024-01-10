import { IdentifierRedeclarationError } from './errors/IdentifierRedeclarationError';
import { ConstantReassignmentError } from './errors/ConstantReassignmentError';
import { UndeclaredIdentifierError } from './errors/UndeclaredIdentifierError';
import { UndeclaredFunctionError } from './errors/UndeclaredFunctionError';
import { wrapInteger } from './helpers/wrapInteger';
import {
    type IVariable,
    type TRegister,
    type IScope,
    type IDataTypeInfo,
    type TAssemblyStreamNames,
    type IFunction,
} from './types';
import {
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
    type TNodeBinaryExpression,
    type INodeScope,
    type INodeStatementVariableDefinition,
} from '../Parser/types';
import { ArgumentImbalanceError } from './errors/ArgumentImbalanceError';

class Generator {
    private readonly scopes: IScope[] = [{ sizeBytes: 0, variables: {}, functions: {} }];
    private assemblyEmissionStreamName: keyof TAssemblyStreamNames = 'main';
    private currentFunctionIdentifier: string | null = null;
    private labelCount: number = 0;
    private readonly assembly: TAssemblyStreamNames = {
        main: '',
        functions: '',
    };

    public generateAssembly(statements: readonly TNodeStatement[]): string {
        this.emitFunctionPrologue();

        statements.forEach(this.generateStatement.bind(this));

        // Add an initial syscall to ensure the program always exits.
        this.move('rax', '60');
        this.move('rdi', '0');
        this.leave();
        this.syscall();

        return `global _start\n${this.assembly.functions}\n_start:\n${this.assembly.main}`;
    }

    private generateStatement(statement: TNodeStatement): void {
        switch (statement.type) {
            case 'variable': {
                const identifier = statement.definition.identifier.literal;

                if (this.getVariable(identifier) !== null) {
                    throw new IdentifierRedeclarationError(identifier);
                }

                this.generateExpression(
                    {
                        type: statement.definition.dataType,
                        unsigned: statement.definition.unsigned,
                    },
                    statement.expression,
                );

                this.getCurrentScope().variables[identifier] = {
                    stackLocation: this.getCurrentScope().sizeBytes,
                    type: statement.definition.dataType,
                    unsigned: statement.definition.unsigned,
                    mutable: statement.definition.mutable,
                };

                break;
            }

            case 'variable-reassignment': {
                const identifier = statement.identifier.literal;

                const variable = this.getVariable(identifier);

                if (variable === null) {
                    throw new UndeclaredIdentifierError(identifier);
                }

                if (!variable.mutable) {
                    throw new ConstantReassignmentError(identifier);
                }

                this.generateExpression(
                    {
                        type: variable.type,
                        unsigned: variable.unsigned,
                    },
                    statement.expression,
                );

                const fullRegister = 'rax';
                const registerSubset = this.getRegisterFromDataType(variable.type, 'a');

                if (registerSubset === fullRegister) {
                    this.move(fullRegister, '[rsp]');
                } else {
                    this.moveAndExtend(variable.unsigned, variable.type, fullRegister, '[rsp]');
                }

                // Direct memory to memory transfers are disallowed in x86-64 assembly,
                // therefore we have to move into a register, then from the register to the address.
                this.move(this.getBasePointerOffset(variable.stackLocation), fullRegister);

                break;
            }

            case 'scope': {
                this.generateAnonymousScope(statement);

                break;
            }

            case 'if': {
                const mainLabel = this.getLabel('main');

                this.generateExpression({ type: 'qword', unsigned: false }, statement.expression);

                // Pop the value into rax so it's not left on the stack.
                this.pop('rax');
                this.compare('rax', '0');
                this.jumpWhenZero(mainLabel);

                this.generateAnonymousScope(statement.scope);

                this.emitLabel(mainLabel);

                break;
            }

            case 'function': {
                this.assemblyEmissionStreamName = 'functions';

                const identifier = statement.identifier.literal;

                if (this.getFunction(identifier) !== null) {
                    throw new IdentifierRedeclarationError(identifier);
                }

                const returnType: IDataTypeInfo = {
                    type: statement.dataType,
                    unsigned: statement.unsigned,
                };

                const label = this.getLabel(identifier);

                // Preserve the current function identifier so all return statements
                // can retrieve details about the function they're in.
                this.currentFunctionIdentifier = identifier;

                this.getCurrentScope().functions[identifier] = {
                    label,
                    returnType,
                    parameters: statement.parameters,
                };

                this.emitLabel(label);

                this.generateFunctionScope(statement.scope, statement.parameters, returnType);

                this.assemblyEmissionStreamName = 'main';
                this.currentFunctionIdentifier = null;

                break;
            }

            case 'return': {
                if (this.currentFunctionIdentifier === null) {
                    throw new Error(
                        "The 'return' keyword can only be used within the body of a function.",
                    );
                }

                const currentFunction = this.getFunction(this.currentFunctionIdentifier);

                if (currentFunction === null) {
                    throw new Error(
                        "The 'return' keyword can only be used within the body of a function.",
                    );
                }

                this.generateExpression(currentFunction.returnType, statement.expression);
                // Move the result of the expression into rax, ready for function exit.
                this.pop('rax');
                this.emitFunctionEpilogue();

                break;
            }

            case 'while': {
                const whileLabelStart = this.getLabel('while_start');
                const mainLabel = this.getLabel('main');

                this.emitLabel(whileLabelStart);

                this.generateExpression({ type: 'qword', unsigned: false }, statement.expression);

                // Pop the value into rax so it's not left on the stack.
                this.pop('rax');
                this.compare('rax', '0');
                this.jumpWhenZero(mainLabel);

                this.generateAnonymousScope(statement.scope);

                this.jump(whileLabelStart);
                this.emitLabel(mainLabel);

                break;
            }

            case 'terminate': {
                this.generateExpression({ type: 'byte', unsigned: true }, statement.expression);

                this.move('rax', '60');
                this.pop('rdi');
                this.leave();
                this.syscall();

                break;
            }

            case 'term': {
                this.generateTerm({ type: 'qword', unsigned: false }, statement.term);

                break;
            }

            default: {
                return statement satisfies never;
            }
        }
    }

    private generateFunctionScope(
        scope: INodeScope,
        parameters: INodeStatementVariableDefinition[],
        returnType: IDataTypeInfo,
    ): void {
        this.scopes.push({ sizeBytes: 0, variables: {}, functions: {}, returnType });

        this.emitFunctionPrologue();

        // Add the variables to the scope before we generate it.
        parameters.forEach((parameter, index) => {
            this.getCurrentScope().variables[parameter.identifier.literal] = {
                // -16 to move us before the prologue and the return address.
                stackLocation: -16 - index * 8,
                mutable: parameter.mutable,
                unsigned: parameter.unsigned,
                type: parameter.dataType,
            };
        });

        scope.statements.forEach(this.generateStatement.bind(this));

        // Remove the scope.
        this.scopes.pop();
    }

    private generateAnonymousScope(scope: INodeScope): void {
        this.scopes.push({ sizeBytes: 0, variables: {}, functions: {} });

        scope.statements.forEach(this.generateStatement.bind(this));

        const { sizeBytes } = this.getCurrentScope();

        // Deallocate the current scope by moving the stack pointer back to where it was before this scope was created.
        if (sizeBytes > 0) {
            this.add('rsp', sizeBytes.toString(10));
        }

        // Remove the scope.
        this.scopes.pop();
    }

    private generateBinaryExpression(
        dataTypeInfo: IDataTypeInfo,
        expression: TNodeBinaryExpression,
    ): void {
        this.generateExpression(dataTypeInfo, expression.rhs);
        this.generateExpression(dataTypeInfo, expression.lhs);

        const fullFirstRegister = 'rax';
        const fullSecondRegister = 'rcx';

        this.pop(fullFirstRegister);
        this.pop(fullSecondRegister);

        const firstRegister = this.getRegisterFromDataType(dataTypeInfo.type, 'a');
        const secondRegister = this.getRegisterFromDataType(dataTypeInfo.type, 'c');

        ({
            binaryExpressionAdd: (): void => this.add(firstRegister, secondRegister),
            binaryExpressionSubtract: (): void => this.subtract(firstRegister, secondRegister),
            binaryExpressionMultiply: (): void =>
                this.multiply(secondRegister, dataTypeInfo.unsigned),
            binaryExpressionDivide: (): void => this.divide(secondRegister, dataTypeInfo.unsigned),
            binaryExpressionCompare: (): void => {
                this.compare(firstRegister, secondRegister);
                this.setIfEqual('al');
                // Ensure upper bits are zero.
                this.moveAndZeroExtend(fullFirstRegister, 'byte al');
            },
            binaryExpressionGreaterThan: (): void => {
                this.compare(firstRegister, secondRegister);
                this.setIfGreaterThan('al');
                // Ensure upper bits are zero.
                this.moveAndZeroExtend(fullFirstRegister, 'byte al');
            },
            binaryExpressionGreaterThanOrEqual: (): void => {
                this.compare(firstRegister, secondRegister);
                this.setIfGreaterThanOrEqual('al');
                // Ensure upper bits are zero.
                this.moveAndZeroExtend(fullFirstRegister, 'byte al');
            },
            binaryExpressionLessThan: (): void => {
                this.compare(firstRegister, secondRegister);
                this.setIfLessThan('al');
                // Ensure upper bits are zero.
                this.moveAndZeroExtend(fullFirstRegister, 'byte al');
            },
            binaryExpressionLessThanOrEqual: (): void => {
                this.compare(firstRegister, secondRegister);
                this.setIfLessThanOrEqual('al');
                // Ensure upper bits are zero.
                this.moveAndZeroExtend(fullFirstRegister, 'byte al');
            },
        })[expression.type]();

        this.push(fullFirstRegister);
    }

    private generateExpression(dataTypeInfo: IDataTypeInfo, expression: TNodeExpression): void {
        switch (expression.type) {
            case 'term': {
                this.generateTerm(dataTypeInfo, expression.term);

                break;
            }

            case 'binaryExpressionAdd':
            case 'binaryExpressionCompare':
            case 'binaryExpressionLessThan':
            case 'binaryExpressionLessThanOrEqual':
            case 'binaryExpressionGreaterThan':
            case 'binaryExpressionGreaterThanOrEqual':
            case 'binaryExpressionSubtract':
            case 'binaryExpressionMultiply':
            case 'binaryExpressionDivide': {
                this.generateBinaryExpression(dataTypeInfo, expression);

                break;
            }

            default: {
                return expression satisfies never;
            }
        }
    }

    private generateTerm(dataTypeInfo: IDataTypeInfo, term: INodeExpressionTerm['term']): void {
        switch (term.type) {
            case 'integer': {
                const fullRegister = 'rax';
                const registerSubset = this.getRegisterFromDataType(dataTypeInfo.type, 'a');

                // Move the literal into a register to clamp its value.
                this.move(
                    registerSubset,
                    this.wrapIntegerLiteral(dataTypeInfo, term.literal).toString(10),
                );

                // If we're not using the full register, ensure only the correct data is transferred.
                if (registerSubset !== fullRegister) {
                    this.moveAndExtend(
                        dataTypeInfo.unsigned,
                        dataTypeInfo.type,
                        fullRegister,
                        registerSubset,
                    );
                }

                this.push(fullRegister);

                break;
            }

            case 'identifier': {
                const identifier = term.literal;

                const variable = this.getVariable(identifier);

                if (variable === null) {
                    throw new UndeclaredIdentifierError(identifier);
                }

                const fullRegister = 'rax';
                const registerSubset = this.getRegisterFromDataType(dataTypeInfo.type, 'a');
                const variableStackLocation = this.getBasePointerOffset(variable.stackLocation);

                if (registerSubset === fullRegister) {
                    this.move(fullRegister, variableStackLocation);
                } else {
                    this.moveAndExtend(
                        variable.unsigned,
                        variable.type,
                        fullRegister,
                        variableStackLocation,
                    );
                }

                this.push(fullRegister);

                break;
            }

            case 'function_call': {
                const identifier = term.literal;

                const functionDefinition = this.getFunction(identifier);

                if (functionDefinition === null) {
                    throw new UndeclaredFunctionError(identifier);
                }

                if (term.arguments.length !== functionDefinition.parameters.length) {
                    throw new ArgumentImbalanceError(
                        term.arguments.length,
                        functionDefinition.parameters.length,
                    );
                }

                for (let i = term.arguments.length - 1; i >= 0; i -= 1) {
                    // We've verified the balance for a safe check here with the above balance check.
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const parameter = functionDefinition.parameters[i]!;

                    this.generateExpression(
                        {
                            type: parameter.dataType,
                            unsigned: parameter.unsigned,
                        } satisfies IDataTypeInfo,
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        term.arguments.at(i)!,
                    );
                }

                this.call(functionDefinition.label);

                // If this function has arguments, we need to deallocate them all once we've finished the function call.
                if (term.arguments.length > 0) {
                    const allocatedBytes = term.arguments.length * 8;

                    this.add('rsp', allocatedBytes.toString(10));

                    this.getCurrentScope().sizeBytes -= allocatedBytes;
                }

                this.push('rax');

                break;
            }

            case 'parenthesised': {
                this.generateExpression(dataTypeInfo, term.expression);

                break;
            }

            default: {
                return term satisfies never;
            }
        }
    }

    private getCurrentScope(): IScope {
        // There will always be at least one scope.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.scopes.at(-1)!;
    }

    private getVariable(identifier: string): IVariable | null {
        if (this.currentFunctionIdentifier !== null) {
            // It's prohibited to reference variables outside the current function scope.
            const scope = this.searchForScope(
                (scope) => identifier in scope.variables || scope.returnType !== undefined,
            );

            return scope?.variables[identifier] ?? null;
        }

        const scope = this.searchForScope((scope) => identifier in scope.variables);

        return scope?.variables[identifier] ?? null;
    }

    private getFunction(identifier: string): IFunction | null {
        const scope = this.searchForScope((scope) => identifier in scope.functions);

        return scope?.functions[identifier] ?? null;
    }

    private searchForScope(predicate: (scope: IScope) => boolean): IScope | null {
        for (let i = this.scopes.length - 1; i >= 0; i -= 1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const scope = this.scopes.at(i)!;

            if (predicate(scope)) {
                return scope;
            }
        }

        return null;
    }

    private getRegisterFromDataType(
        dataType: IDataTypeInfo['type'],
        register: 'a' | 'b' | 'c' | 'd',
    ): TRegister {
        return {
            byte: { a: 'al', b: 'bl', c: 'cl', d: 'dl' },
            word: { a: 'ax', b: 'bx', c: 'cx', d: 'dx' },
            dword: { a: 'eax', b: 'ebx', c: 'ecx', d: 'edx' },
            qword: { a: 'rax', b: 'rbx', c: 'rcx', d: 'rdx' },
        }[dataType][register];
    }

    private wrapIntegerLiteral(dataTypeInfo: IDataTypeInfo, literal: string): bigint {
        const { min, max } = {
            byte: {
                min: dataTypeInfo.unsigned ? 0 : -128,
                max: dataTypeInfo.unsigned ? 255 : 127,
            },

            word: {
                min: dataTypeInfo.unsigned ? 0 : -32768,
                max: dataTypeInfo.unsigned ? 65535 : 32767,
            },

            dword: {
                min: dataTypeInfo.unsigned ? 0 : -2147483648,
                max: dataTypeInfo.unsigned ? 4294967295 : 2147483647,
            },

            qword: {
                min: dataTypeInfo.unsigned ? BigInt(0) : BigInt('-9223372036854775808'),
                max: dataTypeInfo.unsigned
                    ? BigInt('18446744073709551615')
                    : BigInt('9223372036854775807'),
            },
        }[dataTypeInfo.type];

        return wrapInteger(BigInt(min), BigInt(literal), BigInt(max));
    }

    private getLabel(label: string): string {
        const labelCount = (this.labelCount += 1);

        return `${label}_${labelCount}`;
    }

    private getBasePointerOffset(offset: number): string {
        return `[rbp ${offset >= 0 ? '-' : '+'} ${Math.abs(offset).toString(10)}]`;
    }

    private setIfGreaterThanOrEqual(register: TRegister): void {
        this.emit(`setge ${register}`);
    }

    private setIfGreaterThan(register: TRegister): void {
        this.emit(`setg ${register}`);
    }

    private setIfLessThanOrEqual(register: TRegister): void {
        this.emit(`setle ${register}`);
    }

    private setIfLessThan(register: TRegister): void {
        this.emit(`setl ${register}`);
    }

    private setIfEqual(register: TRegister): void {
        this.emit(`sete ${register}`);
    }

    private push(sourceRegister: TRegister): void {
        this.emit(`push ${sourceRegister}`);

        this.getCurrentScope().sizeBytes += 8;
    }

    private call(functionLabel: string): void {
        this.emit(`call ${functionLabel}`);
    }

    private return(): void {
        this.emit('ret');
    }

    private leave(): void {
        this.emit('leave');
    }

    private pop(destinationRegister: TRegister): void {
        this.emit(`pop ${destinationRegister}`);

        this.getCurrentScope().sizeBytes -= 8;
    }

    private jumpWhenZero(label: string): void {
        this.emit(`jz ${label}`);
    }

    private jump(label: string): void {
        this.emit(`jmp ${label}`);
    }

    private compare(register: TRegister, value: TRegister): void {
        this.emit(`cmp ${register}, ${value}`);
    }

    private move(register: TRegister, value: TRegister): void {
        this.emit(`mov ${register}, ${value}`);
    }

    private syscall(): void {
        this.emit('syscall');
    }

    private moveAndExtend(
        unsigned: boolean,
        dataType: IDataTypeInfo['type'],
        register: TRegister,
        value: TRegister,
    ): void {
        // Qualify the value to ensure we're only transferring necessary data.
        const qualifiedValue = `${dataType} ${value}`;

        unsigned
            ? this.moveAndZeroExtend(register, qualifiedValue)
            : this.moveSignedAndExtend(register, qualifiedValue);
    }

    private moveSignedAndExtend(register: TRegister, value: TRegister): void {
        this.emit(`movsx ${register}, ${value}`);
    }

    private moveAndZeroExtend(register: TRegister, value: TRegister): void {
        this.emit(`movzx ${register}, ${value}`);
    }

    private add(register: TRegister, value: TRegister): void {
        this.emit(`add ${register}, ${value}`);
    }

    private subtract(register: TRegister, value: TRegister): void {
        this.emit(`sub ${register}, ${value}`);
    }

    private multiply(register: TRegister, unsigned: boolean): void {
        const instruction = unsigned ? 'mul' : 'imul';

        this.emit(`${instruction} ${register}`);
    }

    private divide(register: TRegister, unsigned: boolean): void {
        const instruction = unsigned ? 'div' : 'idiv';

        this.emit(`${instruction} ${register}`);
    }

    private emitFunctionEpilogue(): void {
        this.leave();
        this.return();
    }

    private emitFunctionPrologue(): void {
        this.push('rbp');
        this.move('rbp', 'rsp');

        // Even though we've just pushed to the stack, the current scope size needs to be 0
        // because we've just created a new stack frame by moving rsp into rbp.
        this.getCurrentScope().sizeBytes = 0;
    }

    private emitLabel(label: string): void {
        this.emit(`\n${label}:`, false);
    }

    private emit(text: string, indent: boolean = true): void {
        this.assembly[this.assemblyEmissionStreamName] += `${indent ? '    ' : ''}${text}\n`;
    }
}

export { Generator };
