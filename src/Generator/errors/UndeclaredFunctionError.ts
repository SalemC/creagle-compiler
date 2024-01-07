class UndeclaredFunctionError extends Error {
    constructor(identifier: string) {
        super(`Undeclared function '${identifier}'.`);
    }
}

export { UndeclaredFunctionError };
