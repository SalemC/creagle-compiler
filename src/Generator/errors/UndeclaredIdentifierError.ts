class UndeclaredIdentifierError extends Error {
    constructor(identifier: string) {
        super(`Undeclared identifier: ${identifier}.`);
    }
}

export { UndeclaredIdentifierError };
