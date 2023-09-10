export type TVariableList = Record<
    string,
    {
        stackLocationIndex: number;
    }
>;

export type TRegister = 'rax' | 'rbx' | 'rcx' | 'rdx' | 'rbx' | 'rsi' | 'rdi' | 'rsp' | 'rbp';
