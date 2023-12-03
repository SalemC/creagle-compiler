export const wrapInteger = (min: bigint, value: bigint, max: bigint): bigint => {
    const range = BigInt(max - min + BigInt(1));

    return ((((value - min) % range) + range) % range) + min;
};
