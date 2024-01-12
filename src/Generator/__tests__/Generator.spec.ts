import { Generator } from '..';
import { type IScope, type TAssemblyStreamNames } from '../types';

const getAssembly = (generator: Generator, streamName: keyof TAssemblyStreamNames): string =>
    // @ts-expect-error private property.
    generator.assembly[streamName];

// @ts-expect-error private property.
const getCurrentScope = (generator: Generator): IScope => generator.getCurrentScope();

const convertInstructionArrayToString = (instructions: string[]): string =>
    instructions.reduce((accumulator, instruction) => `${accumulator}\n    ${instruction}`, '');

describe('Generator unit', () => {
    it('should append a push assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('push rax');
        expect(getCurrentScope(generator).sizeBytes).toEqual(0);

        // @ts-expect-error private method.
        generator.push('rax');

        expect(getCurrentScope(generator).sizeBytes).toEqual(8);

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(-2)).toEqual('    push rax');
    });

    it('should append a pop assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('pop rax');

        getCurrentScope(generator).sizeBytes = 8;

        // @ts-expect-error private method.
        generator.pop('rax');

        expect(getCurrentScope(generator).sizeBytes).toEqual(0);

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(-2)).toEqual('    pop rax');
    });

    it('should append a mov assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('mov rax, 100');

        // @ts-expect-error private method.
        generator.move('rax', '100');

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(-2)).toEqual('    mov rax, 100');
    });

    it('should append an add assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('add rax, rbx');

        // @ts-expect-error private method.
        generator.add('rax', 'rbx');

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(0)).toEqual('    add rax, rbx');
    });

    it('should append a subtract assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('sub rax, rbx');

        // @ts-expect-error private method.
        generator.subtract('rax', 'rbx');

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(0)).toEqual('    sub rax, rbx');
    });

    it('should append a multiply assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('imul rbx');

        // @ts-expect-error private method.
        generator.multiply('rbx');

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(0)).toEqual('    imul rbx');
    });

    it('should append a divide assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('idiv rbx');

        // @ts-expect-error private method.
        generator.divide('rbx');

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(0)).toEqual('    idiv rbx');
    });

    it('should append an indented assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator, 'main')).not.toContain('add rax, rbx');

        // @ts-expect-error private method.
        generator.emit('add rax, rbx');

        const assembly = getAssembly(generator, 'main').split('\n');

        expect(assembly.at(-2)).toEqual('    add rax, rbx');
    });

    it('should generate initial assembly', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([]);

        const expectedInstructions = [
            'push rbp',
            'mov rbp, rsp',
            'mov rax, 60',
            'mov rdi, 0',
            'leave',
            'syscall',
        ];

        const expectedAssembly =
            'global _start\n\n_start:' +
            convertInstructionArrayToString(expectedInstructions) +
            '\n';

        expect(assembly).toEqual(expectedAssembly);
    });
});

describe('Generator feature', () => {
    it('should generate assembly with addition expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                definition: {
                    type: 'variable-definition',
                    dataType: 'byte',
                    identifier: {
                        type: 'identifier',
                        literal: 'value',
                        location: { column: 10, row: 1 },
                    },
                    mutable: true,
                    unsigned: false,
                },
                expression: {
                    type: 'binaryExpressionAdd',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
            },
        ]);

        const expectedInstructions = [
            'push rbp',
            'mov rbp, rsp',
            'mov al, 2',
            'movsx rax, byte al',
            'push rax',
            'mov al, 8',
            'movsx rax, byte al',
            'push rax',
            'pop rax',
            'pop rcx',
            'add al, cl',
            'push rax',
            'mov rax, 60',
            'mov rdi, 0',
            'leave',
            'syscall',
        ];

        const expectedAssembly =
            'global _start\n\n_start:' +
            convertInstructionArrayToString(expectedInstructions) +
            '\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with subtraction expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                definition: {
                    type: 'variable-definition',
                    dataType: 'byte',
                    identifier: {
                        type: 'identifier',
                        literal: 'value',
                        location: { column: 10, row: 1 },
                    },
                    mutable: true,
                    unsigned: false,
                },
                expression: {
                    type: 'binaryExpressionSubtract',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
            },
        ]);

        const expectedInstructions = [
            'push rbp',
            'mov rbp, rsp',
            'mov al, 2',
            'movsx rax, byte al',
            'push rax',
            'mov al, 8',
            'movsx rax, byte al',
            'push rax',
            'pop rax',
            'pop rcx',
            'sub al, cl',
            'push rax',
            'mov rax, 60',
            'mov rdi, 0',
            'leave',
            'syscall',
        ];

        const expectedAssembly =
            'global _start\n\n_start:' +
            convertInstructionArrayToString(expectedInstructions) +
            '\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with multiplication expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                definition: {
                    type: 'variable-definition',
                    dataType: 'byte',
                    identifier: {
                        type: 'identifier',
                        literal: 'value',
                        location: { column: 10, row: 1 },
                    },
                    mutable: true,
                    unsigned: false,
                },
                expression: {
                    type: 'binaryExpressionMultiply',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
            },
        ]);

        const expectedInstructions = [
            'push rbp',
            'mov rbp, rsp',
            'mov al, 2',
            'movsx rax, byte al',
            'push rax',
            'mov al, 8',
            'movsx rax, byte al',
            'push rax',
            'pop rax',
            'pop rcx',
            'imul cl',
            'push rax',
            'mov rax, 60',
            'mov rdi, 0',
            'leave',
            'syscall',
        ];

        const expectedAssembly =
            'global _start\n\n_start:' +
            convertInstructionArrayToString(expectedInstructions) +
            '\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with division expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                definition: {
                    type: 'variable-definition',
                    dataType: 'byte',
                    identifier: {
                        type: 'identifier',
                        literal: 'value',
                        location: { column: 10, row: 1 },
                    },
                    mutable: true,
                    unsigned: false,
                },
                expression: {
                    type: 'binaryExpressionDivide',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
            },
        ]);

        const expectedInstructions = [
            'push rbp',
            'mov rbp, rsp',
            'mov al, 2',
            'movsx rax, byte al',
            'push rax',
            'mov al, 8',
            'movsx rax, byte al',
            'push rax',
            'pop rax',
            'pop rcx',
            'idiv cl',
            'push rax',
            'mov rax, 60',
            'mov rdi, 0',
            'leave',
            'syscall',
        ];

        const expectedAssembly =
            'global _start\n\n_start:' +
            convertInstructionArrayToString(expectedInstructions) +
            '\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with complex multiplication expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                definition: {
                    type: 'variable-definition',
                    dataType: 'byte',
                    identifier: {
                        type: 'identifier',
                        literal: 'value',
                        location: { column: 10, row: 1 },
                    },
                    mutable: true,
                    unsigned: false,
                },
                expression: {
                    type: 'binaryExpressionAdd',
                    lhs: { type: 'term', term: { type: 'integer', literal: '4' } },
                    rhs: {
                        type: 'binaryExpressionMultiply',
                        lhs: {
                            type: 'binaryExpressionDivide',
                            lhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                            rhs: { type: 'term', term: { type: 'integer', literal: '1' } },
                        },
                        rhs: { type: 'term', term: { type: 'integer', literal: '3' } },
                    },
                },
            },
        ]);

        const expectedInstructions = [
            'push rbp',
            'mov rbp, rsp',
            'mov al, 3',
            'movsx rax, byte al',
            'push rax',
            'mov al, 1',
            'movsx rax, byte al',
            'push rax',
            'mov al, 2',
            'movsx rax, byte al',
            'push rax',
            'pop rax',
            'pop rcx',
            'idiv cl',
            'push rax',
            'pop rax',
            'pop rcx',
            'imul cl',
            'push rax',
            'mov al, 4',
            'movsx rax, byte al',
            'push rax',
            'pop rax',
            'pop rcx',
            'add al, cl',
            'push rax',
            'mov rax, 60',
            'mov rdi, 0',
            'leave',
            'syscall',
        ];

        const expectedAssembly =
            'global _start\n\n_start:' +
            convertInstructionArrayToString(expectedInstructions) +
            '\n';

        expect(assembly).toEqual(expectedAssembly);
    });
});
