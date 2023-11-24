import { type TOKEN_TYPES, type DATA_TYPES } from './tokenTypes';

export type TTokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];
export type TDataTypeSpecifier = (typeof DATA_TYPES)[keyof typeof DATA_TYPES];

export interface ILocation {
    row: number;
    column: number;
}

export interface IToken {
    type: TTokenType;
    literal: string;
    location: ILocation;
}
