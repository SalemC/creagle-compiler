class UnhandledTermTypeError extends Error {
    constructor() {
        super('Unhandled term type.');
    }
}

export { UnhandledTermTypeError };
