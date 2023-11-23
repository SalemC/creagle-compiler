import { IdentifierRedeclarationError } from './errors/IdentifierRedeclarationError';
import { UndeclaredIdentifierError } from './errors/UndeclaredIdentifierError';
import { type TVariableList, type TRegister } from './types';
import {
    type TDataType,
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
    type TNodeBinaryExpression,
} from '../Parser/types';

class Generator {
    private readonly variables: TVariableList = {};
    private stackSizeBytes: number = 0;
    private assembly: string = '';

    public generateAssembly(statements: readonly TNodeStatement[]): string {
        this.reset();

        // We don't use the appendAssemblyLine method here because these assembly lines should not be indented.
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
            case 'variable': {
                const identifier = statement.identifier.literal;

                if (identifier in this.variables) {
                    throw new IdentifierRedeclarationError(identifier);
                }

                this.generateExpression(statement.dataType, statement.expression);

                this.variables[identifier] = {
                    stackLocation: this.stackSizeBytes,
                };

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

        this.pop('rax');
        this.pop('rbx');

        const firstRegister = this.getRegisterFromDataType(dataType, 'a');
        const secondRegister = this.getRegisterFromDataType(dataType, 'b');

        ({
            binaryExpressionAdd: (): void => {
                this.add(firstRegister, secondRegister);
            },

            binaryExpressionSubtract: (): void => {
                this.subtract(firstRegister, secondRegister);
            },

            binaryExpressionMultiply: (): void => {
                this.multiply(secondRegister);
            },

            binaryExpressionDivide: (): void => {
                this.divide(secondRegister);
            },
        })[expression.type]();

        this.push('rax');
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

    private generateTerm(dataType: TDataType, term: INodeExpressionTerm['term']): void {
        switch (term.type) {
            case 'integer': {
                this.push(term.literal);

                break;
            }

            case 'identifier': {
                const identifier = term.literal;

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const variable = identifier in this.variables ? this.variables[identifier]! : null;

                if (variable === null) {
                    throw new UndeclaredIdentifierError(identifier);
                }

                const register = this.getRegisterFromDataType(dataType, 'a');

                // If we're not using the entire register, we'll zero it out to remove
                // unwanted remaining bits when we push it later on.
                if (register !== this.getRegisterFromDataType('qword', 'a')) {
                    this.xor('rax', 'rax');
                }

                // Calculate the memory location of an element in the stack,
                // accounting for the fact that the top of the stack corresponds
                // to the lowest memory address.
                const stackMemoryOffset = this.stackSizeBytes - variable.stackLocation;

                // Move the value into a register to let the register clamp it.
                this.move(register, `[rsp + ${stackMemoryOffset.toString(10)}]`);
                this.push('rax');

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

    private push(sourceRegister: TRegister): void {
        this.emit(`push ${sourceRegister}`);

        this.stackSizeBytes += 8;
    }

    private pop(destinationRegister: TRegister): void {
        this.emit(`pop ${destinationRegister}`);

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
