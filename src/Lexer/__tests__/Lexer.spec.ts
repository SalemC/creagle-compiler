import { Lexer } from '..';

describe('Lexer feature', () => {
    it('should lex assignment of integer', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('byte value = 10;');

        expect(tokens).toEqual([
            {
                type: 'byte',
                literal: 'byte',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'identifier',
                literal: 'value',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'assignment',
                literal: '=',
                location: {
                    column: 11,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 13,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 15,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 17,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex function call with 2 integer arguments', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('addNumbers(10, 20);');

        expect(tokens).toEqual([
            {
                type: 'identifier',
                literal: 'addNumbers',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'open_parenthesis',
                literal: '(',
                location: {
                    column: 10,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 11,
                    row: 0,
                },
            },
            {
                type: 'comma',
                literal: ',',
                location: {
                    column: 13,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 15,
                    row: 0,
                },
            },
            {
                type: 'close_parenthesis',
                literal: ')',
                location: {
                    column: 17,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 18,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 20,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex variable assignment of addition of 2 integers', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('byte x = 10 + 20;');

        expect(tokens).toEqual([
            {
                type: 'byte',
                literal: 'byte',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'identifier',
                literal: 'x',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'assignment',
                literal: '=',
                location: {
                    column: 7,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 9,
                    row: 0,
                },
            },
            {
                type: 'plus',
                literal: '+',
                location: {
                    column: 12,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 14,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 16,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 18,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex addition of 2 integers', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('10 + 20');

        expect(tokens).toEqual([
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'plus',
                literal: '+',
                location: {
                    column: 3,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 8,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex subtraction of 2 integers', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('10 - 20');

        expect(tokens).toEqual([
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'hyphen',
                literal: '-',
                location: {
                    column: 3,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 8,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex division of 2 integers', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('10 / 20');

        expect(tokens).toEqual([
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'forward_slash',
                literal: '/',
                location: {
                    column: 3,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 8,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex multiplication of 2 integers', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('10 * 20');

        expect(tokens).toEqual([
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'asterisk',
                literal: '*',
                location: {
                    column: 3,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 8,
                    row: 0,
                },
            },
        ]);
    });

    it('should lex multiplication of 2 integers on second line', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens(`
            10 * 20
        `);

        expect(tokens).toEqual([
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 12,
                    row: 1,
                },
            },
            {
                type: 'asterisk',
                literal: '*',
                location: {
                    column: 15,
                    row: 1,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 17,
                    row: 1,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 9,
                    row: 2,
                },
            },
        ]);
    });

    it('should lex illegal character', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('10 * 20 @ 10');

        expect(tokens).toEqual([
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'asterisk',
                literal: '*',
                location: {
                    column: 3,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '20',
                location: {
                    column: 5,
                    row: 0,
                },
            },
            {
                type: 'illegal',
                literal: '@',
                location: {
                    column: 8,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '10',
                location: {
                    column: 10,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 13,
                    row: 0,
                },
            },
        ]);
    });
});
