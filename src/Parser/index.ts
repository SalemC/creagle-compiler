import { TOKEN_TYPES } from '../Lexer/tokenTypes';
import { type TTokenType, type IToken } from '../Lexer/types';

interface INodeExpressionIdentifier {
    token: IToken;
}

interface INodeExpressionIntegerLiteral {
    token: IToken;
}

type TNodeExpression = INodeExpressionIntegerLiteral | INodeExpressionIdentifier;

interface INodeStatementBase {
    type: unknown;
}

interface INodeStatementConst extends INodeStatementBase {
    type: 'const';
    identifier: IToken;
    expression: TNodeExpression;
}

type TNodeStatement = INodeStatementConst;

class Parser {
    private readonly statements: TNodeStatement[] = [];
    private currentTokenPosition: number = 0;
    private tokens: IToken[] = [];

    public parseTokens(tokens: IToken[]): TNodeStatement[] {
        this.tokens = [...tokens];

        const statements = [...this.parseStatements()];

        this.reset();

        return statements;
    }

    private parseStatements(): TNodeStatement[] {
        const token = this.peek();

        if (token === null) {
            return this.statements;
        }

        switch (token.type) {
            case TOKEN_TYPES.const: {
                this.consumeToken();

                const identifier = this.peek();

                if (!this.isTokenOfType(identifier, TOKEN_TYPES.identifier)) {
                    throw new Error('Expected identifier');
                }

                this.consumeToken();

                const assignmentOperator = this.peek();

                if (!this.isTokenOfType(assignmentOperator, TOKEN_TYPES.equal)) {
                    throw new Error('Expected equals');
                }

                this.consumeToken();

                const expression = this.parseExpression();

                const semiColon = this.peek();

                if (!this.isTokenOfType(semiColon, TOKEN_TYPES.semicolon)) {
                    throw new Error('Expected missing semi colon');
                }

                this.consumeToken();

                this.statements.push({ type: 'const', identifier, expression });

                break;
            }

            default: {
                throw new Error('Invalid token');
            }
        }

        return this.parseStatements();
    }

    private parseExpression(): TNodeExpression {
        const token = this.peek();

        if (this.isTokenOfType(token, TOKEN_TYPES.integer)) {
            this.consumeToken();

            return { token };
        }

        if (this.isTokenOfType(token, TOKEN_TYPES.identifier)) {
            this.consumeToken();

            return { token };
        }

        throw new Error('Invalid expression');
    }

    private isTokenOfType(token: IToken | null, type: TTokenType): token is IToken {
        return token !== null && token.type === type;
    }

    private consumeToken(): void {
        this.currentTokenPosition += 1;
    }

    private peek(offset: number = 0): IToken | null {
        return this.tokens.at(this.currentTokenPosition + offset) ?? null;
    }

    private reset(): void {
        this.tokens.length = 0;
    }
}

export { Parser };
