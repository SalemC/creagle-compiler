import { InvalidExpressionError } from './errors/InvalidExpressionError';
import { InvalidIdentifierError } from './errors/InvalidIdentifierError';
import { type TNodeExpression, type TNodeStatement } from './types';
import { InvalidTokenError } from './errors/InvalidTokenError';
import { type TTokenType, type IToken } from '../Lexer/types';
import { TOKEN_TYPES } from '../Lexer/tokenTypes';

class Parser {
    private readonly statements: TNodeStatement[] = [];
    private currentTokenPosition: number = 0;
    private readonly tokens: IToken[] = [];

    public parseTokens(tokens: IToken[]): TNodeStatement[] {
        this.reset();

        // Copy all the original tokens into our list of tokens to avoid modifying the original array.
        this.tokens.push(...tokens);

        return this.parseStatements();
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
                    throw new InvalidIdentifierError();
                }

                this.consumeToken();

                const assignmentOperator = this.peek();

                if (!this.isTokenOfType(assignmentOperator, TOKEN_TYPES.equal)) {
                    throw new InvalidTokenError('=');
                }

                this.consumeToken();

                const expression = this.parseExpression();

                const semiColon = this.peek();

                if (!this.isTokenOfType(semiColon, TOKEN_TYPES.semicolon)) {
                    throw new InvalidTokenError(';');
                }

                this.consumeToken();

                this.statements.push({ type: 'const', identifier, expression });

                break;
            }

            case TOKEN_TYPES.terminate: {
                this.consumeToken();

                const openParenthesis = this.peek();

                if (!this.isTokenOfType(openParenthesis, TOKEN_TYPES.openParenthesis)) {
                    throw new InvalidTokenError('(');
                }

                this.consumeToken();

                const expression = this.parseExpression();

                const closeParenthesis = this.peek();

                if (!this.isTokenOfType(closeParenthesis, TOKEN_TYPES.closeParenthesis)) {
                    throw new InvalidTokenError(')');
                }

                this.consumeToken();

                const semiColon = this.peek();

                if (!this.isTokenOfType(semiColon, TOKEN_TYPES.semicolon)) {
                    throw new InvalidTokenError(';');
                }

                this.consumeToken();

                this.statements.push({ type: 'terminate', expression });

                break;
            }

            case TOKEN_TYPES.eof: {
                this.consumeToken();

                break;
            }

            default: {
                throw new InvalidTokenError();
            }
        }

        return this.parseStatements();
    }

    private parseExpression(): TNodeExpression {
        const token = this.peek();

        if (this.isTokenOfType(token, TOKEN_TYPES.integer)) {
            this.consumeToken();

            return { type: 'term', term: { type: 'integer', token } };
        }

        if (this.isTokenOfType(token, TOKEN_TYPES.identifier)) {
            this.consumeToken();

            return { type: 'term', term: { type: 'identifier', token } };
        }

        throw new InvalidExpressionError();
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
