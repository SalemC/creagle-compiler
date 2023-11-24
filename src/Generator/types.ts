import { type TDataType } from '../Parser/types';

export interface IVariable {
    stackLocation: number;
    dataType: TDataType;
    mutable: boolean;
}

export interface IScope {
    sizeBytes: number;
    variables: Record<string, IVariable>;
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
