import { type IToken } from '../Lexer/types';

type TNodeExpressionIdentifier = IToken;
type TNodeExpressionIntegerLiteral = IToken;

type TNodeTerm = TNodeExpressionIntegerLiteral | TNodeExpressionIdentifier;

export type TNodeExpression = TNodeTerm;

interface INodeStatementConst {
    type: 'const';
    expression: TNodeExpression;
}

interface INodeStatementReturn {
    type: 'return';
    expression: TNodeExpression;
}

export type TNodeStatement = INodeStatementConst | INodeStatementReturn;
