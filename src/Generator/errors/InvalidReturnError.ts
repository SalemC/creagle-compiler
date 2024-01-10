class InvalidReturnError extends Error {
    constructor() {
        super("The 'return' keyword can only be used within the body of a function.");
    }
}

export { InvalidReturnError };
