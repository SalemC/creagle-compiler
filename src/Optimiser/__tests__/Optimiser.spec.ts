import { Optimiser } from '..';

describe('Optimiser feature', () => {
    it('should remove subsequent register push and pop instructions', () => {
        const optimiser = new Optimiser();

        const unoptimisedAssembly = 'movsx rax, 10\n    push rax\n    pop rax\n';
        const expectedAssembly = 'movsx rax, 10\n';

        expect(optimiser.optimiseAssembly(unoptimisedAssembly)).toEqual(expectedAssembly);
    });
});
