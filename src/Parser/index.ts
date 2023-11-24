import { UnhandledBinaryExpressionOperatorError } from './errors/UnhandledBinaryExpressionOperatorError';
import { type TTokenType, type IToken, type TDataTypeSpecifier } from '../Lexer/types';
import { InvalidExpressionError } from './errors/InvalidExpressionError';
import { InvalidIdentifierError } from './errors/InvalidIdentifierError';
import { InvalidTokenError } from './errors/InvalidTokenError';
import { DATA_TYPES, TOKEN_TYPES } from '../Lexer/tokenTypes';
import {
    type TNodeBinaryExpression,
    type INodeExpressionTerm,
    type TNodeExpression,
    type TNodeStatement,
    type TDataType,
    type INodeStatementVariable,
    type INodeStatementVariableReassignment,
    type INodeStatementTerminate,
    type INodeStatementScope,
} from './types';

class Parser {
    private readonly statements: TNodeStatement[] = [];
    private currentTokenPosition: number = 0;
    private readonly tokens: IToken[] = [];

    public parseTokens(tokens: readonly IToken[]): TNodeStatement[] {
        this.reset();

        // Copy all the original tokens into our list of tokens to avoid modifying the original array.
        this.tokens.push(...tokens);

        while (true) {
            const statement = this.parseStatement();

            // The statement will be null when there's nothing left to parse.
            if (statement === null) {
                break;
            }

            this.statements.push(statement);
        }

        return this.statements;
    }

    private parseStatement(): TNodeStatement | null {
        const token = this.peek();

        // The token is null when there's no more tokens to parse.
        // This should never occur because there should always be an EOF token.
        if (token === null) {
            return null;
        }

        if (this.isTokenOfDataType(token.type)) {
            return this.parseVariable(token.type, false);
        }

        switch (token.type) {
            case TOKEN_TYPES.openCurlyBrace: {
                this.consumeToken();

                const statements: INodeStatementScope['statements'] = [];

                while (true) {
                    const statement = this.parseStatement();

                    // If there aren't any statements left to parse, the scope can't have been closed.
                    if (statement === null) {
                        throw new InvalidTokenError('}');
                    }

                    statements.push(statement);

                    if (this.peek()?.type === TOKEN_TYPES.closeCurlyBrace) {
                        this.consumeToken();

                        return { type: 'scope', statements } satisfies INodeStatementScope;
                    }
                }
            }

            case TOKEN_TYPES.mutable: {
                this.consumeToken();

                const dataType = this.peek()?.type ?? null;

                if (dataType === null || !this.isTokenOfDataType(dataType)) {
                    throw new InvalidTokenError();
                }

                return this.parseVariable(dataType, true);
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

                return {
                    type: 'variable-reassignment',
                    identifier: token,
                    expression,
                } satisfies INodeStatementVariableReassignment;
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

                return { type: 'terminate', expression } satisfies INodeStatementTerminate;
            }

            case TOKEN_TYPES.eof: {
                this.consumeToken();

                return null;
            }

            default: {
                throw new InvalidTokenError();
            }
        }
    }

    private parseVariable(
        dataTypeSpecifier: TDataTypeSpecifier,
        mutable: boolean,
    ): INodeStatementVariable {
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

        return {
            type: 'variable',
            dataType: this.convertDataTypeSpecifierToDataType(dataTypeSpecifier),
            identifier,
            expression,
            mutable,
        };
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
