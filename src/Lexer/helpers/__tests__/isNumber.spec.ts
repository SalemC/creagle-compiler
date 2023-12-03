import { isNumber } from '../isNumber';

describe('isNumber unit', () => {
    '0123456789'.split('').forEach((character) => {
        it(`should return true for ${character}`, () => {
            expect(isNumber(character)).toEqual(true);
        });
    });

    "abcdefghijklmnopqrstuvwxyz`-=_+[]{}'#@~,.<>/?\\|¬".split('').forEach((character) => {
        it(`should return false for ${character}`, () => {
            expect(isNumber(character)).toEqual(false);
        });
    });
});
