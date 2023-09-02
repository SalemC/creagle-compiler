import { type INodeTerm, type TNodeExpression, type TNodeStatement } from '../Parser/types';
import { IdentifierRedeclarationError } from './errors/IdentifierRedeclarationError';
import { UndeclaredIdentifierError } from './errors/UndeclaredIdentifierError';
import { UnhandledExpressionTypeError } from './errors/UnhandledExpressionTypeError';
import { UnhandledStatementTypeError } from './errors/UnhandledStatementTypeError';
import { UnhandledTermTypeError } from './errors/UnhandledTermTypeError';
import { type TVariableList } from './types';

class Generator {
    private assembly: string = '';
    private itemsOnStack: number = 0;
    private readonly variables: TVariableList = {};

    public generateAssembly(statements: TNodeStatement[]): string {
        this.reset();

        // We don't use the appendAssemblyLine method here because these assembly lines should not be indented.
        this.assembly += 'global _start\n\n';
        this.assembly += '_start:\n';

        statements.forEach(this.generateAssemblyForStatement.bind(this));

        this.appendAssemblyLine('mov rax, 60');
        this.appendAssemblyLine('mov rdi, 0');
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

                this.appendAssemblyLine('mov rax, 60');
                this.popFromStack('rdi');
                this.appendAssemblyLine('syscall');

                break;
            }

            default: {
                throw new UnhandledStatementTypeError();
            }
        }
    }

    private generateExpression(expression: TNodeExpression): void {
        switch (expression.type) {
            case 'term': {
                this.generateTerm(expression.term);

                break;
            }

            default: {
                throw new UnhandledExpressionTypeError();
            }
        }
    }

    private generateTerm(term: INodeTerm['term']): void {
        switch (term.type) {
            case 'integer': {
                this.appendAssemblyLine(`mov rax, ${term.token.literal}`);

                this.pushToStack('rax');

                break;
            }

            case 'identifier': {
                const identifier = term.token.literal;

                if (!(identifier in this.variables)) {
                    throw new UndeclaredIdentifierError(identifier);
                }

                // We verified the presence of the identifier key above.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const { stackLocationIndex } = this.variables[identifier]!;

                // Move the referenced value from wherever it is on the stack into rax.
                this.appendAssemblyLine(
                    `mov rax, [rsp + ${(this.itemsOnStack - stackLocationIndex - 1) * 0x08}]`,
                );

                this.pushToStack('rax');

                break;
            }

            default: {
                throw new UnhandledTermTypeError();
            }
        }
    }

    private pushToStack(register: string): void {
        this.appendAssemblyLine(`push ${register}`);

        this.itemsOnStack += 1;
    }

    private popFromStack(register: string): void {
        this.appendAssemblyLine(`pop ${register}`);

        this.itemsOnStack -= 1;
    }

    private appendAssemblyLine(text: string): void {
        this.assembly += `    ${text}\n`;
    }

    private reset(): void {
        this.assembly = '';
    }
}

export { Generator };
