import { Generator } from '..';

// @ts-expect-error private property.
const getAssembly = (generator: Generator): string => generator.assembly;

describe('Generator unit', () => {
    it('should append a push assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('push rax');

        // @ts-expect-error private property.
        expect(generator.stackSizeBytes).toEqual(0);

        // @ts-expect-error private method.
        generator.push('rax');

        // @ts-expect-error private property.
        expect(generator.stackSizeBytes).toEqual(8);

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(-2)).toEqual('    push rax');
    });

    it('should append a pop assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('pop rax');

        // @ts-expect-error private property.
        generator.stackSizeBytes = 8;

        // @ts-expect-error private method.
        generator.pop('rax');

        // @ts-expect-error private property.
        expect(generator.stackSizeBytes).toEqual(0);

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(-2)).toEqual('    pop rax');
    });

    it('should append a mov assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('mov rax, 100');

        // @ts-expect-error private method.
        generator.move('rax', '100');

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(-2)).toEqual('    mov rax, 100');
    });

    it('should append an add assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('add rax, rbx');

        // @ts-expect-error private method.
        generator.add('rax', 'rbx');

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(0)).toEqual('    add rax, rbx');
    });

    it('should append a subtract assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('sub rax, rbx');

        // @ts-expect-error private method.
        generator.subtract('rax', 'rbx');

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(0)).toEqual('    sub rax, rbx');
    });

    it('should append a multiply assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('imul rbx');

        // @ts-expect-error private method.
        generator.multiply('rbx');

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(0)).toEqual('    imul rbx');
    });

    it('should append a divide assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('idiv rbx');

        // @ts-expect-error private method.
        generator.divide('rbx');

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(0)).toEqual('    idiv rbx');
    });

    it('should append an indented assembly line to the underlying assembly', () => {
        const generator = new Generator();

        expect(getAssembly(generator)).not.toContain('add rax, rbx');

        // @ts-expect-error private method.
        generator.emit('add rax, rbx');

        const assembly = getAssembly(generator).split('\n');

        expect(assembly.at(-2)).toEqual('    add rax, rbx');
    });

    it('should reset the underlying assembly', () => {
        const generator = new Generator();

        // @ts-expect-error private property.
        generator.assembly = 'string that should be reset';

        expect(getAssembly(generator)).not.toEqual('');

        // @ts-expect-error private method.
        generator.reset();

        expect(getAssembly(generator)).toEqual('');
    });

    it('should generate initial assembly', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([]);

        const expectedAssembly =
            'global _start\n\n' +
            '_start:\n' +
            '    mov rax, 60\n' +
            '    mov rdi, 0\n' +
            '    syscall\n';

        expect(assembly).toEqual(expectedAssembly);
    });
});

describe('Generator feature', () => {
    it('should generate assembly with addition expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: { column: 10, row: 1 },
                },
                expression: {
                    type: 'binaryExpressionAdd',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
                mutable: true,
                unsigned: false,
            },
        ]);

        const expectedAssembly =
            'global _start\n\n' +
            '_start:\n' +
            '    mov al, 2\n' +
            '    movsx rax, byte al\n' +
            '    push rax\n' +
            '    mov al, 8\n' +
            '    movsx rax, byte al\n' +
            '    pop rbx\n' +
            '    add al, bl\n' +
            '    push rax\n' +
            '    mov rax, 60\n' +
            '    mov rdi, 0\n' +
            '    syscall\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with subtraction expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: { column: 10, row: 1 },
                },
                expression: {
                    type: 'binaryExpressionSubtract',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
                mutable: true,
                unsigned: false,
            },
        ]);

        const expectedAssembly =
            'global _start\n\n' +
            '_start:\n' +
            '    mov al, 2\n' +
            '    movsx rax, byte al\n' +
            '    push rax\n' +
            '    mov al, 8\n' +
            '    movsx rax, byte al\n' +
            '    pop rbx\n' +
            '    sub al, bl\n' +
            '    push rax\n' +
            '    mov rax, 60\n' +
            '    mov rdi, 0\n' +
            '    syscall\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with multiplication expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: { column: 10, row: 1 },
                },
                expression: {
                    type: 'binaryExpressionMultiply',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
                mutable: true,
                unsigned: false,
            },
        ]);

        const expectedAssembly =
            'global _start\n\n' +
            '_start:\n' +
            '    mov al, 2\n' +
            '    movsx rax, byte al\n' +
            '    push rax\n' +
            '    mov al, 8\n' +
            '    movsx rax, byte al\n' +
            '    pop rbx\n' +
            '    imul bl\n' +
            '    push rax\n' +
            '    mov rax, 60\n' +
            '    mov rdi, 0\n' +
            '    syscall\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with division expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: { column: 10, row: 1 },
                },
                expression: {
                    type: 'binaryExpressionDivide',
                    lhs: { type: 'term', term: { type: 'integer', literal: '8' } },
                    rhs: { type: 'term', term: { type: 'integer', literal: '2' } },
                },
                mutable: true,
                unsigned: false,
            },
        ]);

        const expectedAssembly =
            'global _start\n\n' +
            '_start:\n' +
            '    mov al, 2\n' +
            '    movsx rax, byte al\n' +
            '    push rax\n' +
            '    mov al, 8\n' +
            '    movsx rax, byte al\n' +
            '    pop rbx\n' +
            '    idiv bl\n' +
            '    push rax\n' +
            '    mov rax, 60\n' +
            '    mov rdi, 0\n' +
            '    syscall\n';

        expect(assembly).toEqual(expectedAssembly);
    });

    it('should generate assembly with complex multiplication expression', () => {
        const generator = new Generator();

        const assembly = generator.generateAssembly([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: { column: 10, row: 1 },
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
                mutable: true,
                unsigned: false,
            },
        ]);

        const expectedAssembly =
            'global _start\n\n' +
            '_start:\n' +
            '    mov al, 3\n' +
            '    movsx rax, byte al\n' +
            '    push rax\n' +
            '    mov al, 1\n' +
            '    movsx rax, byte al\n' +
            '    push rax\n' +
            '    mov al, 2\n' +
            '    movsx rax, byte al\n' +
            '    pop rbx\n' +
            '    idiv bl\n' +
            '    pop rbx\n' +
            '    imul bl\n' +
            '    push rax\n' +
            '    mov al, 4\n' +
            '    movsx rax, byte al\n' +
            '    pop rbx\n' +
            '    add al, bl\n' +
            '    push rax\n' +
            '    mov rax, 60\n' +
            '    mov rdi, 0\n' +
            '    syscall\n';

        expect(assembly).toEqual(expectedAssembly);
    });
});
