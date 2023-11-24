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

export type TNodeBinaryExpression =
    | INodeBinaryExpressionDivide
    | INodeBinaryExpressionMultiply
    | INodeBinaryExpressionAdd
    | INodeBinaryExpressionSubtract;

export type TNodeExpression = INodeExpressionTerm | TNodeBinaryExpression;

export type TDataType = 'byte' | 'word' | 'dword' | 'qword';

interface INodeStatementVariable {
    type: 'variable';
    dataType: TDataType;
    identifier: IToken;
    expression: TNodeExpression;
    mutable: boolean;
}

interface INodeStatementVariableReassignment {
    type: 'variable-reassignment';
    expression: TNodeExpression;
    identifier: IToken;
}

interface INodeStatementTerminate {
    type: 'terminate';
    expression: TNodeExpression;
}

export type TNodeStatement =
    | INodeStatementVariable
    | INodeStatementVariableReassignment
    | INodeStatementTerminate;
