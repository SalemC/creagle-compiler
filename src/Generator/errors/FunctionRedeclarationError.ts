class FunctionRedeclarationError extends Error {
    constructor(identifier: string) {
        super(`Cannot redeclare function '${identifier}'.`);
    }
}

export { FunctionRedeclarationError };
