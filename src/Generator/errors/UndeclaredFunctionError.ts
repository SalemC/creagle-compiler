class UndeclaredFunctionError extends Error {
    constructor(functionName: string) {
        super(`Undeclared function '${functionName}'.`);
    }
}

export { UndeclaredFunctionError };
