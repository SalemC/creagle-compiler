import { type IToken } from '../Lexer/types';

interface INodeExpressionTermIdentifier {
    literal: IToken['literal'];
    type: 'identifier';
}

interface INodeExpressionTermIntegerLiteral {
    literal: IToken['literal'];
    type: 'integer';
}

interface INodeExpressionTermParenthesised {
    type: 'parenthesised';
    expression: TNodeExpression;
}

export interface INodeExpressionTerm {
    type: 'term';
    term:
        | INodeExpressionTermIntegerLiteral
        | INodeExpressionTermIdentifier
        | INodeExpressionTermParenthesised;
}

interface INodeBinaryExpressionBase {
    lhs: TNodeExpression;
    rhs: TNodeExpression;
}

interface INodeBinaryExpressionAdd extends INodeBinaryExpressionBase {
    type: 'binaryExpressionAdd';
}

interface INodeBinaryExpressionSubtract extends INodeBinaryExpressionBase {
    type: 'binaryExpressionSubtract';
}

interface INodeBinaryExpressionMultiply extends INodeBinaryExpressionBase {
    type: 'binaryExpressionMultiply';
}

interface INodeBinaryExpressionDivide extends INodeBinaryExpressionBase {
    type: 'binaryExpressionDivide';
}

interface INodeBinaryExpressionCompare extends INodeBinaryExpressionBase {
    type: 'binaryExpressionCompare';
}

export type TNodeBinaryExpression =
    | INodeBinaryExpressionDivide
    | INodeBinaryExpressionMultiply
    | INodeBinaryExpressionAdd
    | INodeBinaryExpressionSubtract
    | INodeBinaryExpressionCompare;

export type TNodeExpression = INodeExpressionTerm | TNodeBinaryExpression;

export type TDataType = 'byte' | 'word' | 'dword' | 'qword';

export interface INodeStatementVariable {
    type: 'variable';
    dataType: TDataType;
    identifier: IToken;
    expression: TNodeExpression;
    unsigned: boolean;
    mutable: boolean;
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

export type TNodeStatement =
    | INodeStatementVariable
    | INodeStatementVariableReassignment
    | INodeStatementTerminate
    | INodeScope
    | INodeStatementIf;
