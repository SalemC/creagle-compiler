import { isLetter } from '../isLetter';

describe('isLetter unit', () => {
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((character) => {
        it(`should return true for ${character}`, () => {
            expect(isLetter(character)).toEqual(true);
        });
    });

    "0123456789`-=_+[]{}'#@~,.<>/?\\|¬".split('').forEach((character) => {
        it(`should return false for ${character}`, () => {
            expect(isLetter(character)).toEqual(false);
        });
    });
});
