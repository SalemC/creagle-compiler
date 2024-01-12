class MissingReturnError extends Error {
    constructor(functionIdentifier: string) {
        super(`${functionIdentifier} is missing a return statement, it must return a value.`);
    }
}

export { MissingReturnError };
