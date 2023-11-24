import { UnhandledBinaryExpressionOperatorError } from './errors/UnhandledBinaryExpressionOperatorError';
import { InvalidExpressionError } from './errors/InvalidExpressionError';
import { InvalidIdentifierError } from './errors/InvalidIdentifierError';
import { InvalidTokenError } from './errors/InvalidTokenError';
import { type TTokenType, type IToken, type TDataTypeSpecifier } from '../Lexer/types';
import { DATA_TYPES, TOKEN_TYPES } from '../Lexer/tokenTypes';
import {
    type TNodeBinaryExpression,
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
    type TDataType,
} from './types';

class Parser {
    private readonly statements: TNodeStatement[] = [];
    private currentTokenPosition: number = 0;
    private readonly tokens: IToken[] = [];

    public parseTokens(tokens: readonly IToken[]): TNodeStatement[] {
        this.reset();

        // Copy all the original tokens into our list of tokens to avoid modifying the original array.
        this.tokens.push(...tokens);

        return this.parseStatements();
    }

    private parseStatements(): TNodeStatement[] {
        const token = this.peek();

        // The token is null when there's no more tokens to parse.
        if (token === null) {
            return this.statements;
        }

        if (this.isTokenOfDataType(token.type)) {
            this.parseVariable(token.type, false);

            return this.parseStatements();
        }

        switch (token.type) {
            case TOKEN_TYPES.mutable: {
                this.consumeToken();

                const dataType = this.peek()?.type ?? null;

                if (dataType === null || !this.isTokenOfDataType(dataType)) {
                    throw new InvalidTokenError();
                }

                this.parseVariable(dataType, true);

                break;
            }

            case TOKEN_TYPES.identifier: {
                this.consumeToken();

                if (this.peek()?.type !== TOKEN_TYPES.equal) {
                    throw new InvalidTokenError('=');
                }

                this.consumeToken();

                const expression = this.parseExpression();

                if (this.peek()?.type !== TOKEN_TYPES.semicolon) {
                    throw new InvalidTokenError(';');
                }

                this.consumeToken();

                this.statements.push({
                    type: 'variable-reassignment',
                    identifier: token,
                    expression,
                });

                break;
            }

            case TOKEN_TYPES.terminate: {
                this.consumeToken();

                if (this.peek()?.type !== TOKEN_TYPES.openParenthesis) {
                    throw new InvalidTokenError('(');
                }

                this.consumeToken();

                const expression = this.parseExpression();

                if (this.peek()?.type !== TOKEN_TYPES.closeParenthesis) {
                    throw new InvalidTokenError(')');
                }

                this.consumeToken();

                if (this.peek()?.type !== TOKEN_TYPES.semicolon) {
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

    private parseVariable(dataTypeSpecifier: TDataTypeSpecifier, mutable: boolean): void {
        this.consumeToken();

        const identifier = this.peek();

        if (identifier?.type !== TOKEN_TYPES.identifier) {
            throw new InvalidIdentifierError();
        }

        this.consumeToken();

        if (this.peek()?.type !== TOKEN_TYPES.equal) {
            throw new InvalidTokenError('=');
        }

        this.consumeToken();

        const expression = this.parseExpression();

        if (this.peek()?.type !== TOKEN_TYPES.semicolon) {
            throw new InvalidTokenError(';');
        }

        this.consumeToken();

        this.statements.push({
            type: 'variable',
            dataType: this.convertDataTypeSpecifierToDataType(dataTypeSpecifier),
            identifier,
            expression,
            mutable,
        });
    }

    private parseExpression(minimumPrecedence: number = 0): TNodeExpression {
        const term = this.parseTerm();

        let expression: TNodeExpression = term;

        // Recursively descend binary operations.
        while (true) {
            const currentToken = this.peek();

            if (currentToken === null) {
                break;
            }

            const precedence = this.getBinaryOperatorPrecedence(currentToken.type);

            // If there's no precedence, we're not dealing with a binary operator.
            if (precedence === null || precedence < minimumPrecedence) {
                break;
            }

            this.consumeToken();

            const nextMinimumPrecedence = precedence + 1;

            // All binary operators share the same structure.
            const binaryExpressionBase: Omit<TNodeBinaryExpression, 'type'> = {
                lhs: expression,
                rhs: this.parseExpression(nextMinimumPrecedence),
            };

            switch (currentToken.type) {
                case TOKEN_TYPES.forwardSlash: {
                    expression = {
                        type: 'binaryExpressionDivide',
                        ...binaryExpressionBase,
                    };

                    break;
                }

                case TOKEN_TYPES.asterisk: {
                    expression = {
                        type: 'binaryExpressionMultiply',
                        ...binaryExpressionBase,
                    };

                    break;
                }

                case TOKEN_TYPES.plus: {
                    expression = {
                        type: 'binaryExpressionAdd',
                        ...binaryExpressionBase,
                    };

                    break;
                }

                case TOKEN_TYPES.hyphen: {
                    expression = {
                        type: 'binaryExpressionSubtract',
                        ...binaryExpressionBase,
                    };

                    break;
                }

                default: {
                    throw new UnhandledBinaryExpressionOperatorError(currentToken.type);
                }
            }
        }

        return expression;
    }

    private parseTerm(): INodeExpressionTerm {
        const token = this.peek();

        switch (token?.type) {
            case TOKEN_TYPES.integer: {
                this.consumeToken();

                return { type: 'term', term: { type: 'integer', literal: token.literal } };
            }

            case TOKEN_TYPES.identifier: {
                this.consumeToken();

                return { type: 'term', term: { type: 'identifier', literal: token.literal } };
            }

            case TOKEN_TYPES.openParenthesis: {
                this.consumeToken();

                const expression = this.parseExpression();

                if (this.peek()?.type !== TOKEN_TYPES.closeParenthesis) {
                    throw new InvalidTokenError(')');
                }

                this.consumeToken();

                return { type: 'term', term: { type: 'parenthesised', expression } };
            }

            default: {
                throw new InvalidExpressionError();
            }
        }
    }

    private getBinaryOperatorPrecedence(tokenType: TTokenType): number | null {
        switch (tokenType) {
            case 'forward_slash':
            case 'asterisk': {
                return 1;
            }

            case 'hyphen':
            case 'plus': {
                return 0;
            }

            default: {
                return null;
            }
        }
    }

    private convertDataTypeSpecifierToDataType(dataTypeSpecifier: TDataTypeSpecifier): TDataType {
        return (
            {
                byte: 'byte',
                short: 'word',
                integer: 'dword',
                long: 'qword',
            } satisfies Record<TDataTypeSpecifier, TDataType>
        )[dataTypeSpecifier];
    }

    private isTokenOfDataType(tokenType: TTokenType): tokenType is TDataTypeSpecifier {
        return tokenType in DATA_TYPES;
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
