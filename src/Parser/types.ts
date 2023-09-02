import { type IToken } from '../Lexer/types';

interface INodeExpressionTermBase {
    literal: IToken['literal'];
}

interface INodeExpressionTermIdentifier extends INodeExpressionTermBase {
    type: 'identifier';
}

interface INodeExpressionTermIntegerLiteral extends INodeExpressionTermBase {
    type: 'integer';
}

export interface INodeExpressionTerm {
    type: 'term';
    term: INodeExpressionTermIntegerLiteral | INodeExpressionTermIdentifier;
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

type TNodeBinaryExpression = INodeBinaryExpressionAdd | INodeBinaryExpressionSubtract;

export type TNodeExpression = INodeExpressionTerm | TNodeBinaryExpression;

interface INodeStatementConst {
    type: 'const';
    identifier: IToken;
    expression: TNodeExpression;
}

interface INodeStatementTerminate {
    type: 'terminate';
    expression: TNodeExpression;
}

export type TNodeStatement = INodeStatementConst | INodeStatementTerminate;
