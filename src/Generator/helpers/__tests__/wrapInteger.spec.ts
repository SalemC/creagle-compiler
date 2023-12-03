import { wrapInteger } from '../wrapInteger';

type TDataProvider = [number, number, number, number][];

describe('wrapInteger unit', () => {
    (
        [
            // Values that should be wrapped.
            [0, 10, 5, 4],
            [10, 2, 20, 13],
            [-20, 25, 20, -16],
            // Values that shouldn't be wrapped.
            [0, 3, 10, 3],
            [-20, -18, 0, -18],
            [10, 12, 20, 12],
        ] satisfies TDataProvider
    ).forEach(([min, value, max, expected]) => {
        it(`should return ${expected} for ${value} within min: ${min} and max: ${max}`, () => {
            const result = wrapInteger(BigInt(min), BigInt(value), BigInt(max));
            const expectedResult = BigInt(expected);

            // Convert the values from a number to a string because the BigInt primitive cannot be serialised.
            expect(result.toString(10)).toEqual(expectedResult.toString(10));
        });
    });
});
