import { InvalidExpressionError } from '../errors/InvalidExpressionError';
import { InvalidIdentifierError } from '../errors/InvalidIdentifierError';
import { InvalidTokenError } from '../errors/InvalidTokenError';
import { Parser } from '..';

describe('Parser', () => {
    it('should parse assignment of integer', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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

        expect(statements).toEqual([
            {
                type: 'const',
                identifier: { type: 'identifier', literal: 'value' },
                expression: {
                    type: 'term',
                    term: {
                        type: 'integer',
                        literal: '420',
                    },
                },
            },
        ]);
    });

    it('should parse assignment of identifier', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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
                type: 'const',
                literal: 'const',
            },
            {
                type: 'identifier',
                literal: 'secondValue',
            },
            {
                type: 'equal',
                literal: '=',
            },
            {
                type: 'identifier',
                literal: 'value',
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

        expect(statements).toEqual([
            {
                type: 'const',
                identifier: { type: 'identifier', literal: 'value' },
                expression: {
                    type: 'term',
                    term: {
                        type: 'integer',
                        literal: '420',
                    },
                },
            },
            {
                type: 'const',
                identifier: { type: 'identifier', literal: 'secondValue' },
                expression: {
                    type: 'term',
                    term: {
                        type: 'identifier',
                        literal: 'value',
                    },
                },
            },
        ]);
    });

    it('should parse assignment of integer addition', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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
                type: 'plus',
                literal: '+',
            },
            {
                type: 'integer',
                literal: '69',
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

        expect(statements).toEqual([
            {
                type: 'const',
                identifier: { type: 'identifier', literal: 'value' },
                expression: {
                    type: 'binaryExpressionAdd',
                    lhs: {
                        type: 'term',
                        term: {
                            type: 'integer',
                            literal: '420',
                        },
                    },
                    rhs: {
                        type: 'term',
                        term: {
                            type: 'integer',
                            literal: '69',
                        },
                    },
                },
            },
        ]);
    });

    it('should parse assignment of integer subtraction', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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
                type: 'hyphen',
                literal: '-',
            },
            {
                type: 'integer',
                literal: '69',
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

        expect(statements).toEqual([
            {
                type: 'const',
                identifier: { type: 'identifier', literal: 'value' },
                expression: {
                    type: 'binaryExpressionSubtract',
                    lhs: {
                        type: 'term',
                        term: {
                            type: 'integer',
                            literal: '420',
                        },
                    },
                    rhs: {
                        type: 'term',
                        term: {
                            type: 'integer',
                            literal: '69',
                        },
                    },
                },
            },
        ]);
    });

    it('should throw when invalid identifier is used for const declaration', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
                {
                    type: 'const',
                    literal: 'const',
                },
                {
                    type: 'integer',
                    literal: '10',
                },
            ]);
        }).toThrow(InvalidIdentifierError);
    });

    it('should throw when invalid assignment operator is used for const declaration', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
                {
                    type: 'const',
                    literal: 'const',
                },
                {
                    type: 'identifier',
                    literal: 'value',
                },
                {
                    type: 'integer',
                    literal: '10',
                },
            ]);
        }).toThrow(InvalidTokenError);
    });

    it('should throw when const declaration is missing semicolon', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
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
            ]);
        }).toThrow(InvalidTokenError);
    });

    it('should throw when there is an invalid token', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
                {
                    type: 'unknown-invalid-token' as any,
                    literal: 'unknown-invalid-token',
                },
            ]);
        }).toThrow(InvalidTokenError);
    });

    it('should parse terminate method', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
            {
                type: 'terminate',
                literal: 'terminate',
            },
            {
                type: 'open_parenthesis',
                literal: '(',
            },
            {
                type: 'integer',
                literal: '0',
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

        expect(statements).toEqual([
            {
                type: 'terminate',
                expression: {
                    type: 'term',
                    term: {
                        type: 'integer',
                        literal: '0',
                    },
                },
            },
        ]);
    });

    it('should throw when terminate has invalid open parenthesis', () => {
        const parser = new Parser();

        expect(() =>
            parser.parseTokens([
                {
                    type: 'terminate',
                    literal: 'terminate',
                },
                {
                    type: 'integer',
                    literal: '0',
                },
            ]),
        ).toThrow(InvalidTokenError);
    });

    it('should throw when terminate has invalid close parenthesis', () => {
        const parser = new Parser();

        expect(() =>
            parser.parseTokens([
                {
                    type: 'terminate',
                    literal: 'terminate',
                },
                {
                    type: 'open_parenthesis',
                    literal: '(',
                },
                {
                    type: 'integer',
                    literal: '0',
                },
                {
                    type: 'integer',
                    literal: '0',
                },
            ]),
        ).toThrow(InvalidTokenError);
    });

    it('should throw when terminate is missing semicolon', () => {
        const parser = new Parser();

        expect(() =>
            parser.parseTokens([
                {
                    type: 'terminate',
                    literal: 'terminate',
                },
                {
                    type: 'open_parenthesis',
                    literal: '(',
                },
                {
                    type: 'integer',
                    literal: '0',
                },
                {
                    type: 'close_parenthesis',
                    literal: ')',
                },
            ]),
        ).toThrow(InvalidTokenError);
    });

    it('should throw when there is an invalid expression', () => {
        const parser = new Parser();

        expect(() =>
            parser.parseTokens([
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
                    type: 'plus',
                    literal: '+',
                },
                {
                    type: 'plus',
                    literal: '+',
                },
                {
                    type: 'semicolon',
                    literal: ';',
                },
                {
                    type: 'eof',
                    literal: '\0',
                },
            ]),
        ).toThrow(InvalidExpressionError);
    });
});
