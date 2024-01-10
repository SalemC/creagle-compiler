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
    type INodeScope,
    type INodeStatementIf,
    type INodeStatementWhile,
    type INodeStatementFunction,
    type INodeStatementReturn,
    type INodeExpressionTermIntegerLiteral,
    type INodeExpressionTermIdentifier,
    type INodeExpressionTermParenthesised,
    type INodeExpressionTermFunctionCall,
    type INodeStatementVariableDefinition,
} from './types';

class Parser {
    private readonly statements: TNodeStatement[] = [];
    private currentTokenPosition: number = 0;
    private readonly tokens: IToken[] = [];

    public parseTokens(tokens: readonly IToken[]): TNodeStatement[] {
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

        switch (token.type) {
            case TOKEN_TYPES.if: {
                this.consumeToken();
                this.consumeToken(TOKEN_TYPES.openParenthesis);

                const expression = this.parseExpression();

                this.consumeToken(TOKEN_TYPES.closeParenthesis);

                const scope = this.parseScope();

                return { type: 'if', expression, scope } satisfies INodeStatementIf;
            }

            case TOKEN_TYPES.while: {
                this.consumeToken();
                this.consumeToken(TOKEN_TYPES.openParenthesis);

                const expression = this.parseExpression();

                this.consumeToken(TOKEN_TYPES.closeParenthesis);

                const scope = this.parseScope();

                return { type: 'while', expression, scope } satisfies INodeStatementWhile;
            }

            case TOKEN_TYPES.openCurlyBrace: {
                return this.parseScope();
            }

            case TOKEN_TYPES.unsigned: {
                // Skip the data type and the identifier, go straight for the succeeding token; if it's an open parenthesis, we're parsing a function.
                const isFunction = this.peek(3)?.type === 'open_parenthesis';

                return isFunction ? this.parseFunction() : this.parseVariable();
            }

            case TOKEN_TYPES.mutable: {
                return this.parseVariable();
            }

            case TOKEN_TYPES.identifier: {
                if (this.peek(1)?.type !== TOKEN_TYPES.assignment) {
                    const term = this.parseTerm();

                    this.consumeToken(TOKEN_TYPES.semicolon);

                    return term;
                }

                this.consumeToken();
                this.consumeToken(TOKEN_TYPES.assignment);

                const expression = this.parseExpression();

                this.consumeToken(TOKEN_TYPES.semicolon);

                return {
                    type: 'variable-reassignment',
                    identifier: token,
                    expression,
                } satisfies INodeStatementVariableReassignment;
            }

            case TOKEN_TYPES.terminate: {
                this.consumeToken();
                this.consumeToken(TOKEN_TYPES.openParenthesis);

                const expression = this.parseExpression();

                this.consumeToken(TOKEN_TYPES.closeParenthesis);
                this.consumeToken(TOKEN_TYPES.semicolon);

                return { type: 'terminate', expression } satisfies INodeStatementTerminate;
            }

            case TOKEN_TYPES.return: {
                this.consumeToken();

                const expression = this.parseExpression();

                this.consumeToken(TOKEN_TYPES.semicolon);

                return { type: 'return', expression } satisfies INodeStatementReturn;
            }

            case TOKEN_TYPES.eof: {
                this.consumeToken();

                return null;
            }

            default: {
                if (this.isTokenOfDataType(token.type)) {
                    // Skip the identifier, go straight for the succeeding token; if it's an open parenthesis, we're parsing a function.
                    const isFunction = this.peek(2)?.type === 'open_parenthesis';

                    return isFunction ? this.parseFunction() : this.parseVariable();
                }

                try {
                    const term = this.parseTerm();

                    this.consumeToken(TOKEN_TYPES.semicolon);

                    return term;
                } catch {
                    // If it's not a valid term, we'll let this fall through and continue execution.
                }

                throw new InvalidTokenError();
            }
        }
    }

    private parseScope(): INodeScope {
        this.consumeToken(TOKEN_TYPES.openCurlyBrace);

        const statements: INodeScope['statements'] = [];

        while (this.peek() !== null && this.peek()?.type !== TOKEN_TYPES.closeCurlyBrace) {
            const statement = this.parseStatement();

            // If there aren't any statements left to parse, the scope can't have been closed.
            if (statement === null) {
                throw new InvalidTokenError('}');
            }

            statements.push(statement);
        }

        this.consumeToken(TOKEN_TYPES.closeCurlyBrace);

        return { type: 'scope', statements } satisfies INodeScope;
    }

    private parseFunction(): INodeStatementFunction {
        let unsigned = false;

        if (this.peek()?.type === TOKEN_TYPES.unsigned) {
            this.consumeToken();

            unsigned = true;
        }

        const dataType = this.peek()?.type ?? null;

        if (dataType === null || !this.isTokenOfDataType(dataType)) {
            throw new InvalidTokenError();
        }

        this.consumeToken();

        const identifier = this.peek();

        if (identifier?.type !== TOKEN_TYPES.identifier) {
            throw new InvalidIdentifierError();
        }

        this.consumeToken();
        this.consumeToken(TOKEN_TYPES.openParenthesis);

        const parameters: INodeStatementVariableDefinition[] = [];

        while (this.peek()?.type !== TOKEN_TYPES.closeParenthesis) {
            parameters.push(this.parseVariableDefinition());

            if (this.peek()?.type === TOKEN_TYPES.comma) {
                this.consumeToken();

                // A comma should not be directly succeeded by a close parenthesis.
                if (this.peek()?.type === TOKEN_TYPES.closeParenthesis) {
                    throw new InvalidTokenError();
                }
            }
        }

        this.consumeToken(TOKEN_TYPES.closeParenthesis);

        const scope = this.parseScope();

        return {
            type: 'function',
            dataType: this.convertDataTypeSpecifierToDataType(dataType),
            identifier,
            unsigned,
            scope,
            parameters,
        } satisfies INodeStatementFunction;
    }

    private parseVariableDefinition(): INodeStatementVariableDefinition {
        let unsigned = false;
        let mutable = false;

        if (this.peek()?.type === TOKEN_TYPES.mutable) {
            this.consumeToken();

            mutable = true;
        }

        if (this.peek()?.type === TOKEN_TYPES.unsigned) {
            this.consumeToken();

            unsigned = true;
        }

        const dataType = this.peek()?.type ?? null;

        if (dataType === null || !this.isTokenOfDataType(dataType)) {
            throw new InvalidTokenError();
        }

        this.consumeToken();

        const identifier = this.peek();

        if (identifier?.type !== TOKEN_TYPES.identifier) {
            throw new InvalidIdentifierError();
        }

        this.consumeToken();

        return {
            type: 'variable-definition',
            dataType: this.convertDataTypeSpecifierToDataType(dataType),
            identifier,
            mutable,
            unsigned,
        } satisfies INodeStatementVariableDefinition;
    }

    private parseVariable(): INodeStatementVariable {
        const variableDefinition = this.parseVariableDefinition();

        this.consumeToken(TOKEN_TYPES.assignment);

        const expression = this.parseExpression();

        this.consumeToken(TOKEN_TYPES.semicolon);

        return {
            type: 'variable',
            definition: variableDefinition,
            expression,
        } satisfies INodeStatementVariable;
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
                case TOKEN_TYPES.lessThan: {
                    expression = {
                        type: 'binaryExpressionLessThan',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.lessThanOrEqual: {
                    expression = {
                        type: 'binaryExpressionLessThanOrEqual',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.greaterThan: {
                    expression = {
                        type: 'binaryExpressionGreaterThan',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.greaterThanOrEqual: {
                    expression = {
                        type: 'binaryExpressionGreaterThanOrEqual',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.equal: {
                    expression = {
                        type: 'binaryExpressionCompare',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.forwardSlash: {
                    expression = {
                        type: 'binaryExpressionDivide',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.asterisk: {
                    expression = {
                        type: 'binaryExpressionMultiply',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.plus: {
                    expression = {
                        type: 'binaryExpressionAdd',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

                    break;
                }

                case TOKEN_TYPES.hyphen: {
                    expression = {
                        type: 'binaryExpressionSubtract',
                        ...binaryExpressionBase,
                    } satisfies TNodeBinaryExpression;

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

                return {
                    type: 'term',
                    term: {
                        type: 'integer',
                        literal: token.literal,
                    } satisfies INodeExpressionTermIntegerLiteral,
                };
            }

            case TOKEN_TYPES.identifier: {
                this.consumeToken();

                if (this.peek()?.type === TOKEN_TYPES.openParenthesis) {
                    this.consumeToken();

                    // @todo probably should have some lookup here to validate arguments instead of in generation.
                    const functionArguments: TNodeExpression[] = [];

                    while (this.peek()?.type !== TOKEN_TYPES.closeParenthesis) {
                        functionArguments.push(this.parseExpression());

                        if (this.peek()?.type === TOKEN_TYPES.comma) {
                            this.consumeToken();

                            // A comma should not be directly succeeded by a close parenthesis.
                            if (this.peek()?.type === TOKEN_TYPES.closeParenthesis) {
                                throw new InvalidTokenError();
                            }
                        }
                    }

                    this.consumeToken(TOKEN_TYPES.closeParenthesis);

                    return {
                        type: 'term',
                        term: {
                            type: 'function_call',
                            literal: token.literal,
                            arguments: functionArguments,
                        } satisfies INodeExpressionTermFunctionCall,
                    };
                }

                return {
                    type: 'term',
                    term: {
                        type: 'identifier',
                        literal: token.literal,
                    } satisfies INodeExpressionTermIdentifier,
                };
            }

            case TOKEN_TYPES.openParenthesis: {
                this.consumeToken();

                const expression = this.parseExpression();

                this.consumeToken(TOKEN_TYPES.closeParenthesis);

                return {
                    type: 'term',
                    term: {
                        type: 'parenthesised',
                        expression,
                    } satisfies INodeExpressionTermParenthesised,
                };
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

            case 'greater_than_or_equal':
            case 'greater_than':
            case 'less_than_or_equal':
            case 'less_than':
            case 'hyphen':
            case 'equal':
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

    private consumeToken(expectedTokenType?: TTokenType): void {
        if (expectedTokenType !== undefined && this.peek()?.type !== expectedTokenType) {
            throw new InvalidTokenError(expectedTokenType);
        }

        this.currentTokenPosition += 1;
    }

    private peek(offset: number = 0): IToken | null {
        return this.tokens.at(this.currentTokenPosition + offset) ?? null;
    }
}

export { Parser };
