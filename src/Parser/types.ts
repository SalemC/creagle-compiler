import { type IToken } from '../Lexer/types';

interface INodeTermIdentifier {
    type: 'identifier';
    token: IToken;
}

interface INodeTermIntegerLiteral {
    type: 'integer';
    token: IToken;
}

export interface INodeTerm {
    type: 'term';
    term: INodeTermIntegerLiteral | INodeTermIdentifier;
}

export type TNodeExpression = INodeTerm;

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
