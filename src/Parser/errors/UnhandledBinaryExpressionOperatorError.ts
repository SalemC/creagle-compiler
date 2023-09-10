class UnhandledBinaryExpressionOperatorError extends Error {
    constructor(operator: string) {
        super(`Unhandled binary expression operator: ${operator}.`);
    }
}

export { UnhandledBinaryExpressionOperatorError };
