class ArgumentImbalanceError extends Error {
    constructor(argumentCount: number, expectedArgumentCount: number) {
        super(
            `Expected ${expectedArgumentCount.toString(
                10,
            )} arguments, you provided ${argumentCount.toString(10)}.`,
        );
    }
}

export { ArgumentImbalanceError };
