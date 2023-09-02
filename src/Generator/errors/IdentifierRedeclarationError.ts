class IdentifierRedeclarationError extends Error {
    constructor(identifier: string) {
        super(`Unable to redeclare identifier: ${identifier}.`);
    }
}

export { IdentifierRedeclarationError };
