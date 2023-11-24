import { IdentifierRedeclarationError } from './errors/IdentifierRedeclarationError';
import { ConstantReassignmentError } from './errors/ConstantReassignmentError';
import { UndeclaredIdentifierError } from './errors/UndeclaredIdentifierError';
import { type IVariable, type TRegister, type IScope } from './types';
import {
    type TDataType,
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
    type TNodeBinaryExpression,
} from '../Parser/types';

class Generator {
    private readonly scopes: IScope[] = [{ sizeBytes: 0, variables: {} }];
    private stackSizeBytes: number = 0;
    private assembly: string = '';

    public generateAssembly(statements: readonly TNodeStatement[]): string {
        this.reset();

        // We don't use the emit method here because these assembly lines should not be indented.
        this.assembly += 'global _start\n\n';
        this.assembly += '_start:\n';

        statements.forEach(this.generateAssemblyForStatement.bind(this));

        // Add an initial syscall to ensure the program always exits.
        this.move('rax', '60');
        this.move('rdi', '0');
        this.emit('syscall');

        return this.assembly;
    }

    private generateAssemblyForStatement(statement: TNodeStatement): void {
        switch (statement.type) {
            case 'scope': {
                this.scopes.push({ sizeBytes: 0, variables: {} });

                statement.statements.forEach(this.generateAssemblyForStatement.bind(this));

                const { sizeBytes } = this.getCurrentScope();

                // Move the stack pointer back to where it was before this scope was created.
                this.add('rsp', sizeBytes.toString(10));

                this.stackSizeBytes -= sizeBytes;

                // Remove the scope along with all its variables.
                this.scopes.splice(-1, 1);

                break;
            }

            case 'variable': {
                const identifier = statement.identifier.literal;

                if (this.getVariable(identifier) !== null) {
                    throw new IdentifierRedeclarationError(identifier);
                }

                this.generateExpression(statement.dataType, statement.expression);

                this.getCurrentScope().variables[identifier] = {
                    stackLocation: this.stackSizeBytes,
                    dataType: statement.dataType,
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

                this.generateExpression(variable.dataType, statement.expression);

                const variableStackLocation = this.getStackPointerOffset(
                    this.stackSizeBytes - variable.stackLocation,
                );

                const registerSubset = this.getRegisterFromDataType(variable.dataType, 'a');
                const fullRegister = this.getRegisterFromDataType('qword', 'a');

                // If we're not using the entire register, we'll zero it out to remove previously written bits.
                if (registerSubset !== fullRegister) {
                    this.xor(fullRegister, fullRegister);
                }

                this.move(registerSubset, '[rsp]');
                this.move(variableStackLocation, fullRegister);

                break;
            }

            case 'terminate': {
                this.generateExpression('byte', statement.expression);

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

    private generateBinaryExpression(dataType: TDataType, expression: TNodeBinaryExpression): void {
        this.generateExpression(dataType, expression.rhs);
        this.generateExpression(dataType, expression.lhs);

        this.pop(this.getRegisterFromDataType('qword', 'a'));
        this.pop(this.getRegisterFromDataType('qword', 'b'));

        const firstRegister = this.getRegisterFromDataType(dataType, 'a');
        const secondRegister = this.getRegisterFromDataType(dataType, 'b');

        ({
            binaryExpressionAdd: (): void => this.add(firstRegister, secondRegister),
            binaryExpressionSubtract: (): void => this.subtract(firstRegister, secondRegister),
            binaryExpressionMultiply: (): void => this.multiply(secondRegister),
            binaryExpressionDivide: (): void => this.divide(secondRegister),
        })[expression.type]();

        this.push(this.getRegisterFromDataType('qword', 'a'));
    }

    private generateExpression(dataType: TDataType, expression: TNodeExpression): void {
        switch (expression.type) {
            case 'term': {
                this.generateTerm(dataType, expression.term);

                break;
            }

            case 'binaryExpressionAdd':
            case 'binaryExpressionSubtract':
            case 'binaryExpressionMultiply':
            case 'binaryExpressionDivide': {
                this.generateBinaryExpression(dataType, expression);

                break;
            }

            default: {
                return expression satisfies never;
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

    private generateTerm(dataType: TDataType, term: INodeExpressionTerm['term']): void {
        switch (term.type) {
            case 'integer': {
                const registerSubset = this.getRegisterFromDataType(dataType, 'a');
                const fullRegister = this.getRegisterFromDataType('qword', 'a');

                // If we're not using the entire register, we'll zero it out to remove previously written bits.
                if (registerSubset !== fullRegister) {
                    this.xor(fullRegister, fullRegister);
                }

                // Move the literal into a register to clamp its value.
                this.move(registerSubset, term.literal);
                this.push(fullRegister);

                break;
            }

            case 'identifier': {
                const identifier = term.literal;

                const variable = this.getVariable(identifier);

                if (variable === null) {
                    throw new UndeclaredIdentifierError(identifier);
                }

                const registerSubset = this.getRegisterFromDataType(dataType, 'a');
                const fullRegister = this.getRegisterFromDataType('qword', 'a');

                // If we're not using the entire register, we'll zero it out to remove previously written bits.
                if (registerSubset !== fullRegister) {
                    this.xor(fullRegister, fullRegister);
                }

                const variableStackLocation = this.getStackPointerOffset(
                    this.stackSizeBytes - variable.stackLocation,
                );

                // Move the value into a register to let the register clamp it.
                this.move(registerSubset, variableStackLocation);
                this.push(fullRegister);

                break;
            }

            case 'parenthesised': {
                this.generateExpression(dataType, term.expression);

                break;
            }

            default: {
                return term satisfies never;
            }
        }
    }

    private getRegisterFromDataType(
        dataType: TDataType,
        register: 'a' | 'b' | 'c' | 'd',
    ): TRegister {
        return {
            byte: { a: 'al', b: 'bl', c: 'cl', d: 'dl' },
            word: { a: 'ax', b: 'bx', c: 'cx', d: 'dx' },
            dword: { a: 'eax', b: 'ebx', c: 'ecx', d: 'edx' },
            qword: { a: 'rax', b: 'rbx', c: 'rcx', d: 'rdx' },
        }[dataType][register];
    }

    private getStackPointerOffset(offset: number): string {
        return offset === 0 ? '[rsp]' : `[rsp + ${offset.toString(10)}]`;
    }

    private push(sourceRegister: TRegister): void {
        this.emit(`push ${sourceRegister}`);

        this.getCurrentScope().sizeBytes += 8;

        this.stackSizeBytes += 8;
    }

    private pop(destinationRegister: TRegister): void {
        this.emit(`pop ${destinationRegister}`);

        this.getCurrentScope().sizeBytes -= 8;

        this.stackSizeBytes -= 8;
    }

    private xor(firstRegister: TRegister, secondRegister: TRegister): void {
        this.emit(`xor ${firstRegister}, ${secondRegister}`);
    }

    private move(destinationRegister: TRegister, value: string): void {
        this.emit(`mov ${destinationRegister}, ${value}`);
    }

    private add(lhsRegister: TRegister, rhsRegister: TRegister): void {
        this.emit(`add ${lhsRegister}, ${rhsRegister}`);
    }

    private subtract(lhsRegister: TRegister, rhsRegister: TRegister): void {
        this.emit(`sub ${lhsRegister}, ${rhsRegister}`);
    }

    private multiply(sourceRegister: TRegister): void {
        this.emit(`mul ${sourceRegister}`);
    }

    private divide(sourceRegister: TRegister): void {
        this.emit(`div ${sourceRegister}`);
    }

    private emit(text: string): void {
        this.assembly += `    ${text}\n`;
    }

    private reset(): void {
        this.assembly = '';
    }
}

export { Generator };
