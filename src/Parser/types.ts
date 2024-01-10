import { type IToken } from '../Lexer/types';

export interface INodeExpressionTermIdentifier {
    type: 'identifier';
    literal: IToken['literal'];
}

export interface INodeExpressionTermIntegerLiteral {
    type: 'integer';
    literal: IToken['literal'];
}

export interface INodeExpressionTermParenthesised {
    type: 'parenthesised';
    expression: TNodeExpression;
}

export interface INodeExpressionTermFunctionCall {
    type: 'function_call';
    literal: IToken['literal'];
    arguments: TNodeExpression[];
}

export interface INodeExpressionTerm {
    type: 'term';
    term:
        | INodeExpressionTermIntegerLiteral
        | INodeExpressionTermIdentifier
        | INodeExpressionTermParenthesised
        | INodeExpressionTermFunctionCall;
}

interface INodeBinaryExpression<T extends string> {
    type: T;
    lhs: TNodeExpression;
    rhs: TNodeExpression;
}

type TNodeBinaryExpressionAdd = INodeBinaryExpression<'binaryExpressionAdd'>;
type TNodeBinaryExpressionSubtract = INodeBinaryExpression<'binaryExpressionSubtract'>;
type TNodeBinaryExpressionMultiply = INodeBinaryExpression<'binaryExpressionMultiply'>;
type TNodeBinaryExpressionDivide = INodeBinaryExpression<'binaryExpressionDivide'>;
type TNodeBinaryExpressionCompare = INodeBinaryExpression<'binaryExpressionCompare'>;

type TNodeBinaryExpressionGreaterThan = INodeBinaryExpression<'binaryExpressionGreaterThan'>;
type TNodeBinaryExpressionGreaterThanOrEqual =
    INodeBinaryExpression<'binaryExpressionGreaterThanOrEqual'>;

type TNodeBinaryExpressionLessThan = INodeBinaryExpression<'binaryExpressionLessThan'>;
type TNodeBinaryExpressionLessThanOrEqual =
    INodeBinaryExpression<'binaryExpressionLessThanOrEqual'>;

export type TNodeBinaryExpression =
    | TNodeBinaryExpressionDivide
    | TNodeBinaryExpressionMultiply
    | TNodeBinaryExpressionAdd
    | TNodeBinaryExpressionSubtract
    | TNodeBinaryExpressionCompare
    | TNodeBinaryExpressionGreaterThan
    | TNodeBinaryExpressionGreaterThanOrEqual
    | TNodeBinaryExpressionLessThan
    | TNodeBinaryExpressionLessThanOrEqual;

export type TNodeExpression = INodeExpressionTerm | TNodeBinaryExpression;

export type TDataType = 'byte' | 'word' | 'dword' | 'qword';

export interface INodeStatementVariableDefinition {
    type: 'variable-definition';
    dataType: TDataType;
    identifier: IToken;
    unsigned: boolean;
    mutable: boolean;
}

export interface INodeStatementVariable {
    type: 'variable';
    definition: INodeStatementVariableDefinition;
    expression: TNodeExpression;
}

export interface INodeStatementVariableReassignment {
    type: 'variable-reassignment';
    expression: TNodeExpression;
    identifier: IToken;
}

export interface INodeStatementTerminate {
    type: 'terminate';
    expression: TNodeExpression;
}

export interface INodeScope {
    type: 'scope';
    statements: TNodeStatement[];
}

export interface INodeStatementIf {
    type: 'if';
    expression: TNodeExpression;
    scope: INodeScope;
}

export interface INodeStatementWhile {
    type: 'while';
    expression: TNodeExpression;
    scope: INodeScope;
}

export interface INodeStatementFunction {
    type: 'function';
    dataType: TDataType;
    identifier: IToken;
    unsigned: boolean;
    scope: INodeScope;
    parameters: INodeStatementVariableDefinition[];
}

export interface INodeStatementReturn {
    type: 'return';
    expression: TNodeExpression;
}

export type TNodeStatement =
    | INodeStatementVariable
    | INodeStatementVariableReassignment
    | INodeStatementTerminate
    | INodeScope
    | INodeStatementIf
    | INodeStatementWhile
    | INodeStatementFunction
    | INodeStatementReturn
    | INodeExpressionTerm;
