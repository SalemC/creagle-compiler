import { Lexer } from '..';

describe('Lexer', () => {
    it('should lex assignment of integer', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('const value = 420;');

        expect(tokens).toEqual([
            {
                type: 'const',
                literal: 'const',
            },
            {
                type: 'identifier',
                literal: 'value',
            },
            {
                type: 'equal',
                literal: '=',
            },
            {
                type: 'integer',
                literal: '420',
            },
            {
                type: 'semicolon',
                literal: ';',
            },
            {
                type: 'eof',
                literal: '\0',
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
            },
            {
                type: 'open_parenthesis',
                literal: '(',
            },
            {
                type: 'integer',
                literal: '10',
            },
            {
                type: 'comma',
                literal: ',',
            },
            {
                type: 'integer',
                literal: '20',
            },
            {
                type: 'close_parenthesis',
                literal: ')',
            },
            {
                type: 'semicolon',
                literal: ';',
            },
            {
                type: 'eof',
                literal: '\0',
            },
        ]);
    });

    it('should lex variable assignment of addition of 2 integers', () => {
        const lexer = new Lexer();

        const tokens = lexer.convertToTokens('const x = 10 + 20;');

        expect(tokens).toEqual([
            {
                type: 'const',
                literal: 'const',
            },
            {
                type: 'identifier',
                literal: 'x',
            },
            {
                type: 'equal',
                literal: '=',
            },
            {
                type: 'integer',
                literal: '10',
            },
            {
                type: 'plus',
                literal: '+',
            },
            {
                type: 'integer',
                literal: '20',
            },
            {
                type: 'semicolon',
                literal: ';',
            },
            {
                type: 'eof',
                literal: '\0',
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
            },
            {
                type: 'plus',
                literal: '+',
            },
            {
                type: 'integer',
                literal: '20',
            },
            {
                type: 'eof',
                literal: '\0',
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
            },
            {
                type: 'hyphen',
                literal: '-',
            },
            {
                type: 'integer',
                literal: '20',
            },
            {
                type: 'eof',
                literal: '\0',
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
            },
            {
                type: 'forward_slash',
                literal: '/',
            },
            {
                type: 'integer',
                literal: '20',
            },
            {
                type: 'eof',
                literal: '\0',
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
            },
            {
                type: 'asterisk',
                literal: '*',
            },
            {
                type: 'integer',
                literal: '20',
            },
            {
                type: 'eof',
                literal: '\0',
            },
        ]);
    });
});
