class InvalidTokenError extends Error {
    constructor(expectedToken?: string) {
        super(`Invalid token.${expectedToken === undefined ? '' : ` Expected: ${expectedToken}.`}`);
    }
}

export { InvalidTokenError };
