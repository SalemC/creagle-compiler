import { type TDataType } from '../Parser/types';

export interface IDataTypeInfo {
    type: TDataType;
    unsigned: boolean;
}

export interface IVariable extends IDataTypeInfo {
    stackLocation: number;
    mutable: boolean;
}

export interface IScope {
    sizeBytes: number;
    variables: Record<string, IVariable>;
    returnType?: IDataTypeInfo;
}

export type TAssemblyStreamNames = Record<'main' | 'functions', string>;

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
