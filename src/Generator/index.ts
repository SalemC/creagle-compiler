import { IdentifierRedeclarationError } from './errors/IdentifierRedeclarationError';
import { ConstantReassignmentError } from './errors/ConstantReassignmentError';
import { UndeclaredIdentifierError } from './errors/UndeclaredIdentifierError';
import { wrapInteger } from './helpers/wrapInteger';
import {
    type IVariable,
    type TRegister,
    type IScope,
    type IDataTypeInfo,
    type TAssemblyStreamNames,
} from './types';
import {
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
    type TNodeBinaryExpression,
    type INodeScope,
} from '../Parser/types';

class Generator {
    private readonly scopes: IScope[] = [{ sizeBytes: 0, variables: {} }];
    private assemblyOutputStreamName: keyof TAssemblyStreamNames = 'main';
    private stackSizeBytes: number = 0;
    private labelCount: number = 0;
    private readonly assembly: TAssemblyStreamNames = {
        main: '',
        functions: '',
    };

    public generateAssembly(statements: readonly TNodeStatement[]): string {
        statements.forEach(this.generateStatement.bind(this));

        // Add an initial syscall to ensure the program always exits.
        this.move('rax', '60');
        this.move('rdi', '0');
        this.emit('syscall');

        return `global _start\n${this.assembly.functions}\n_start:\n${this.assembly.main}`;
    }

    private generateStatement(statement: TNodeStatement): void {
        switch (statement.type) {
            case 'variable': {
                const identifier = statement.identifier.literal;

                if (this.getVariable(identifier) !== null) {
                    throw new IdentifierRedeclarationError(identifier);
                }

                this.generateExpression(
                    {
                        type: statement.dataType,
                        unsigned: statement.unsigned,
                    },
                    statement.expression,
                );

                this.getCurrentScope().variables[identifier] = {
                    stackLocation: this.stackSizeBytes,
                    type: statement.dataType,
                    unsigned: statement.unsigned,
                    mutable: statement.mutable,
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

                const variableStackLocation = this.getStackPointerOffset(
                    this.stackSizeBytes - variable.stackLocation,
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
                this.move(variableStackLocation, fullRegister);

                break;
            }

            case 'scope': {
                this.generateScope(statement);

                break;
            }

            case 'if': {
                const mainLabel = this.generateLabel('main');

                this.generateExpression({ type: 'qword', unsigned: false }, statement.expression);

                // Pop the value into rax so it's not left on the stack.
                this.pop('rax');
                this.compare('rax', '0');
                this.jumpWhenZero(mainLabel);

                this.generateScope(statement.scope);

                this.emit(`\n${mainLabel}:`, false);

                break;
            }

            case 'function': {
                this.assemblyOutputStreamName = 'functions';

                const functionLabel = this.generateLabel(statement.identifier.literal);

                this.emit(`\n${functionLabel}:`, false);

                this.generateScope(statement.scope, {
                    type: statement.dataType,
                    unsigned: statement.unsigned,
                });

                // It's the scope's responsibility to put the return value in the correct register
                // before we return due to the potential need to deallocate the scope.
                this.return();

                this.assemblyOutputStreamName = 'main';

                break;
            }

            case 'return': {
                const { returnType } = this.getCurrentScope();

                if (returnType === undefined) {
                    throw new Error(
                        'The `return` keyword can only be used within the body of a function.',
                    );
                }

                this.generateExpression(returnType, statement.expression);

                this.pop('rax');

                // We don't use the return keyword here because we can assert we're inside a function's scope.
                // Since that's the case, our function body may have allocated variables on the stack
                // and we will need to deallocate them before returning.
                // The responsibility of this is delegated to the function statement generator.

                break;
            }

            case 'while': {
                const whileLabelStart = this.generateLabel('while_start');
                const mainLabel = this.generateLabel('main');

                this.emit(`\n${whileLabelStart}:`, false);

                this.generateExpression({ type: 'qword', unsigned: false }, statement.expression);

                // Pop the value into rax so it's not left on the stack.
                this.pop('rax');
                this.compare('rax', '0');
                this.jumpWhenZero(mainLabel);

                this.generateScope(statement.scope);

                this.jump(whileLabelStart);
                this.emit(`\n${mainLabel}:`, false);

                break;
            }

            case 'terminate': {
                this.generateExpression({ type: 'byte', unsigned: true }, statement.expression);

                this.move('rax', '60');
                this.pop('rdi');
                this.emit('syscall');

                break;
            }

            default: {
                return statement satisfies never;
            }
        }
    }

    private generateScope(scope: INodeScope, dataTypeInfo?: IDataTypeInfo): void {
        this.scopes.push({ sizeBytes: 0, variables: {}, returnType: dataTypeInfo });

        scope.statements.forEach(this.generateStatement.bind(this));

        const { sizeBytes } = this.getCurrentScope();

        // Move the stack pointer back to where it was before this scope was created.
        this.add('rsp', sizeBytes.toString(10));

        this.stackSizeBytes -= sizeBytes;

        // Remove the scope along with all its variables.
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

                const variableStackLocation = this.getStackPointerOffset(
                    this.stackSizeBytes - variable.stackLocation,
                );

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
        const currentScope = this.scopes.at(-1) ?? null;

        if (currentScope !== null) {
            return currentScope;
        }

        // If there isn't already a scope, create a new one and return it.
        const newScope: IScope = {
            sizeBytes: 0,
            variables: {},
        };

        this.scopes.push(newScope);

        return newScope;
    }

    private getVariable(identifier: string): IVariable | null {
        if (this.scopes.length === 0) {
            return null;
        }

        // Search through the current and the parent scopes for the variable.
        for (let i = this.scopes.length - 1; i >= 0; i -= 1) {
            const scope = this.scopes.at(i) ?? null;

            if (scope !== null && identifier in scope.variables) {
                return scope.variables[identifier] ?? null;
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

    private generateLabel(prefix?: string): string {
        const labelCount = (this.labelCount += 1);

        return `${prefix === null ? '' : `${prefix}_`}label_${labelCount}`;
    }

    private getStackPointerOffset(offset: number): string {
        return offset === 0 ? '[rsp]' : `[rsp + ${offset.toString(10)}]`;
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
        this.stackSizeBytes += 8;
    }

    private return(): void {
        this.emit('ret');
    }

    private pop(destinationRegister: TRegister): void {
        this.emit(`pop ${destinationRegister}`);

        this.getCurrentScope().sizeBytes -= 8;
        this.stackSizeBytes -= 8;
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

    private emit(text: string, indent: boolean = true): void {
        this.assembly[this.assemblyOutputStreamName] += `${indent ? '    ' : ''}${text}\n`;
    }
}

export { Generator };
