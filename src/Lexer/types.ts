import { type TOKEN_TYPES } from './tokenTypes';

export type TTokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

export interface IToken {
    type: TTokenType;
    literal: string;
}
