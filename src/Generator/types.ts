import { type TDataType } from '../Parser/types';

export interface IVariable {
    stackLocation: number;
    dataType: TDataType;
    unsigned: boolean;
    mutable: boolean;
}

export interface IScope {
    sizeBytes: number;
    variables: Record<string, IVariable>;
}

export interface IDataTypeInfo {
    type: TDataType;
    unsigned: boolean;
}

export type TRegister =
    | 'rax'
    | 'rbx'
    | 'rcx'
    | 'rdx'
    | 'rbx'
    | 'rsi'
    | 'rdi'
    | 'rsp'
    | 'rbp'
    | string;
