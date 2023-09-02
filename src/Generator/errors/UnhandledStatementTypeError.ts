class UnhandledStatementTypeError extends Error {
    constructor() {
        super('Unhandled statement type.');
    }
}

export { UnhandledStatementTypeError };
