class MissingIdentifierError extends Error {
    constructor() {
        super('Expected identifier.');
    }
}

export { MissingIdentifierError };
