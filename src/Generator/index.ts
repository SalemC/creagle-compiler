import { IdentifierRedeclarationError } from './errors/IdentifierRedeclarationError';
import { UndeclaredIdentifierError } from './errors/UndeclaredIdentifierError';
import { type TVariableList, type TRegister } from './types';
import {
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
} from '../Parser/types';

class Generator {
    private readonly variables: TVariableList = {};
    private itemsOnStack: number = 0;
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
        this.appendAssemblyLine('syscall');

        return this.assembly;
    }

    private generateAssemblyForStatement(statement: TNodeStatement): void {
        switch (statement.type) {
            case 'const': {
                const identifier = statement.identifier.literal;

                if (identifier in this.variables) {
                    throw new IdentifierRedeclarationError(identifier);
                }

                this.variables[identifier] = {
                    stackLocationIndex: this.itemsOnStack,
                };

                this.generateExpression(statement.expression);

                break;
            }

            case 'terminate': {
                this.generateExpression(statement.expression);

                this.move('rax', '60');
                this.pop('rdi');
                this.appendAssemblyLine('syscall');

                break;
            }

            default: {
                return statement satisfies never;
            }
        }
    }

    private generateExpression(expression: TNodeExpression): void {
        switch (expression.type) {
            case 'term': {
                this.generateTerm(expression.term);

                break;
            }

            case 'binaryExpressionAdd': {
                this.generateExpression(expression.rhs);
                this.generateExpression(expression.lhs);

                this.add('rax', 'rbx');

                break;
            }

            case 'binaryExpressionSubtract': {
                this.generateExpression(expression.rhs);
                this.generateExpression(expression.lhs);

                this.subtract('rax', 'rbx');

                break;
            }

            case 'binaryExpressionMultiply': {
                this.generateExpression(expression.rhs);
                this.generateExpression(expression.lhs);

                this.multiply('rbx');

                break;
            }

            case 'binaryExpressionDivide': {
                this.generateExpression(expression.rhs);
                this.generateExpression(expression.lhs);

                this.divide('rbx');

                break;
            }

            default: {
                return expression satisfies never;
            }
        }
    }

    private generateTerm(term: INodeExpressionTerm['term']): void {
        switch (term.type) {
            case 'integer': {
                this.move('rax', term.literal);
                this.push('rax');

                break;
            }

            case 'identifier': {
                const identifier = term.literal;

                if (!(identifier in this.variables)) {
                    throw new UndeclaredIdentifierError(identifier);
                }

                // We verified the presence of the identifier key above.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const { stackLocationIndex } = this.variables[identifier]!;

                // Calculate the memory location of an element in the stack,
                // accounting for the fact that the top of the stack corresponds
                // to the lowest memory address.
                const stackMemoryOffset = (this.itemsOnStack - 1 - stackLocationIndex) * 0x08;

                // Move the referenced value from wherever it is on the stack into rax.
                this.move('rax', `[rsp + 0x${stackMemoryOffset.toString(16)}]`);
                this.push('rax');

                break;
            }

            case 'parenthesised': {
                this.generateExpression(term.expression);

                break;
            }

            default: {
                return term satisfies never;
            }
        }
    }

    private push(sourceRegister: TRegister): void {
        this.appendAssemblyLine(`push ${sourceRegister}`);

        this.itemsOnStack += 1;
    }

    private pop(destinationRegister: TRegister): void {
        this.appendAssemblyLine(`pop ${destinationRegister}`);

        this.itemsOnStack -= 1;
    }

    private move(destinationRegister: TRegister, value: string): void {
        this.appendAssemblyLine(`mov ${destinationRegister}, ${value}`);
    }

    private add(lhsRegister: TRegister, rhsRegister: TRegister): void {
        this.pop(lhsRegister);
        this.pop(rhsRegister);

        this.appendAssemblyLine(`add ${lhsRegister}, ${rhsRegister}`);

        this.push(lhsRegister);
    }

    private subtract(lhsRegister: TRegister, rhsRegister: TRegister): void {
        this.pop(lhsRegister);
        this.pop(rhsRegister);

        this.appendAssemblyLine(`sub ${lhsRegister}, ${rhsRegister}`);

        this.push(lhsRegister);
    }

    private multiply(sourceRegister: TRegister): void {
        // 'mul' always uses 'rax' as the left operand, then stores the result in 'rax'.
        this.pop('rax');
        this.pop(sourceRegister);

        this.appendAssemblyLine(`mul ${sourceRegister}`);

        this.push('rax');
    }

    private divide(sourceRegister: TRegister): void {
        // 'div' always uses 'rax' as the left operand, then stores the result in 'rax'.
        this.pop('rax');
        this.pop(sourceRegister);

        this.appendAssemblyLine(`div ${sourceRegister}`);

        this.push('rax');
    }

    private appendAssemblyLine(text: string): void {
        this.assembly += `    ${text}\n`;
    }

    private reset(): void {
        this.assembly = '';
    }
}

export { Generator };
