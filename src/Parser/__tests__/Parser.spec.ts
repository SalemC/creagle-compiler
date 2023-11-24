import { InvalidExpressionError } from '../errors/InvalidExpressionError';
import { InvalidIdentifierError } from '../errors/InvalidIdentifierError';
import { InvalidTokenError } from '../errors/InvalidTokenError';
import { Parser } from '..';

describe('Parser feature', () => {
    it('should parse assignment of integer', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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
                type: 'equal',
                literal: '=',
                location: {
                    column: 6,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '420',
                location: {
                    column: 7,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 10,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 11,
                    row: 0,
                },
            },
        ]);

        expect(statements).toEqual([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: {
                        column: 5,
                        row: 0,
                    },
                },
                mutable: false,
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
                type: 'equal',
                literal: '=',
                location: {
                    column: 6,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '420',
                location: {
                    column: 7,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 10,
                    row: 0,
                },
            },
            {
                type: 'byte',
                literal: 'byte',
                location: {
                    column: 10,
                    row: 0,
                },
            },
            {
                type: 'identifier',
                literal: 'secondValue',
                location: {
                    column: 11,
                    row: 0,
                },
            },
            {
                type: 'equal',
                literal: '=',
                location: {
                    column: 23,
                    row: 0,
                },
            },
            {
                type: 'identifier',
                literal: 'value',
                location: {
                    column: 24,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 29,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 30,
                    row: 0,
                },
            },
        ]);

        expect(statements).toEqual([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: {
                        column: 5,
                        row: 0,
                    },
                },
                expression: {
                    type: 'term',
                    term: {
                        type: 'integer',
                        literal: '420',
                    },
                },
                mutable: false,
            },
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'secondValue',
                    location: {
                        column: 11,
                        row: 0,
                    },
                },
                expression: {
                    type: 'term',
                    term: {
                        type: 'identifier',
                        literal: 'value',
                    },
                },
                mutable: false,
            },
        ]);
    });

    it('should parse assignment of integer addition', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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
                type: 'equal',
                literal: '=',
                location: {
                    column: 6,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '420',
                location: {
                    column: 7,
                    row: 0,
                },
            },
            {
                type: 'plus',
                literal: '+',
                location: {
                    column: 8,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '69',
                location: {
                    column: 9,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 11,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 12,
                    row: 0,
                },
            },
        ]);

        expect(statements).toEqual([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: {
                        column: 5,
                        row: 0,
                    },
                },
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
                mutable: false,
            },
        ]);
    });

    it('should parse assignment of integer subtraction', () => {
        const parser = new Parser();

        const statements = parser.parseTokens([
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
                type: 'equal',
                literal: '=',
                location: {
                    column: 6,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '420',
                location: {
                    column: 7,
                    row: 0,
                },
            },
            {
                type: 'hyphen',
                literal: '-',
                location: {
                    column: 8,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '69',
                location: {
                    column: 9,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 11,
                    row: 0,
                },
            },
            {
                type: 'eof',
                literal: '\0',
                location: {
                    column: 12,
                    row: 0,
                },
            },
        ]);

        expect(statements).toEqual([
            {
                type: 'variable',
                dataType: 'byte',
                identifier: {
                    type: 'identifier',
                    literal: 'value',
                    location: {
                        column: 5,
                        row: 0,
                    },
                },
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
                mutable: false,
            },
        ]);
    });

    it('should throw when invalid identifier is used for variable declaration', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
                {
                    type: 'byte',
                    literal: 'byte',
                    location: {
                        column: 0,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '10',
                    location: {
                        column: 5,
                        row: 0,
                    },
                },
            ]);
        }).toThrow(InvalidIdentifierError);
    });

    it('should throw when invalid assignment operator is used for variable declaration', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
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
                    type: 'integer',
                    literal: '10',
                    location: {
                        column: 10,
                        row: 0,
                    },
                },
            ]);
        }).toThrow(InvalidTokenError);
    });

    it('should throw when const declaration is missing semicolon', () => {
        const parser = new Parser();

        expect(() => {
            parser.parseTokens([
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
                    type: 'equal',
                    literal: '=',
                    location: {
                        column: 6,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '420',
                    location: {
                        column: 7,
                        row: 0,
                    },
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
                    location: {
                        column: 0,
                        row: 0,
                    },
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
                location: {
                    column: 0,
                    row: 0,
                },
            },
            {
                type: 'open_parenthesis',
                literal: '(',
                location: {
                    column: 9,
                    row: 0,
                },
            },
            {
                type: 'integer',
                literal: '0',
                location: {
                    column: 10,
                    row: 0,
                },
            },
            {
                type: 'close_parenthesis',
                literal: ')',
                location: {
                    column: 11,
                    row: 0,
                },
            },
            {
                type: 'semicolon',
                literal: ';',
                location: {
                    column: 12,
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
                    location: {
                        column: 0,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '0',
                    location: {
                        column: 9,
                        row: 0,
                    },
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
                    location: {
                        column: 0,
                        row: 0,
                    },
                },
                {
                    type: 'open_parenthesis',
                    literal: '(',
                    location: {
                        column: 9,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '0',
                    location: {
                        column: 10,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '0',
                    location: {
                        column: 12,
                        row: 0,
                    },
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
                    location: {
                        column: 0,
                        row: 0,
                    },
                },
                {
                    type: 'open_parenthesis',
                    literal: '(',
                    location: {
                        column: 9,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '0',
                    location: {
                        column: 10,
                        row: 0,
                    },
                },
                {
                    type: 'close_parenthesis',
                    literal: ')',
                    location: {
                        column: 11,
                        row: 0,
                    },
                },
            ]),
        ).toThrow(InvalidTokenError);
    });

    it('should throw when there is an invalid expression', () => {
        const parser = new Parser();

        expect(() =>
            parser.parseTokens([
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
                    type: 'equal',
                    literal: '=',
                    location: {
                        column: 6,
                        row: 0,
                    },
                },
                {
                    type: 'integer',
                    literal: '420',
                    location: {
                        column: 7,
                        row: 0,
                    },
                },
                {
                    type: 'plus',
                    literal: '+',
                    location: {
                        column: 10,
                        row: 0,
                    },
                },
                {
                    type: 'semicolon',
                    literal: ';',
                    location: {
                        column: 11,
                        row: 0,
                    },
                },
                {
                    type: 'eof',
                    literal: '\0',
                    location: {
                        column: 12,
                        row: 0,
                    },
                },
            ]),
        ).toThrow(InvalidExpressionError);
    });
});
