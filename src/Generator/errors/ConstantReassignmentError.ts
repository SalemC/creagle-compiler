class ConstantReassignmentError extends Error {
    constructor(identifier: string) {
        super(`Cannot reassign variable '${identifier}' as it is constant.`);
    }
}

export { ConstantReassignmentError };
