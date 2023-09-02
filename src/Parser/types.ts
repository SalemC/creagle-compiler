import { type IToken } from '../Lexer/types';

interface INodeExpressionTermIdentifier {
    type: 'identifier';
    token: IToken;
}

interface INodeExpressionTermIntegerLiteral {
    type: 'integer';
    token: IToken;
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
