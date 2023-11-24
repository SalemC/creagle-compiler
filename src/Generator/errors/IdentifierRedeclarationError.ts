class IdentifierRedeclarationError extends Error {
    constructor(identifier: string) {
        super(`Cannot redeclare variable '${identifier}'.`);
    }
}

export { IdentifierRedeclarationError };
