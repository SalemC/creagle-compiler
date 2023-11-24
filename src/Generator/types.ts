import { type TDataType } from '../Parser/types';

export type TVariableList = Record<
    string,
    {
        stackLocation: number;
        dataType: TDataType;
        mutable: boolean;
    }
>;

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
