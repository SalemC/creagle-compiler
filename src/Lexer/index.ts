import { isLetter } from './helpers/isLetter';
import { isNumber } from './helpers/isNumber';

const KEYWORDS = {
    const: 'const',
    let: 'let',
    return: 'return',
    true: 'true',
    false: 'false',
    if: 'if',
    else: 'else',
} as const;

const TOKEN_TYPES = {
    ...KEYWORDS,
    semicolon: 'semicolon',
    assignment: 'assignment',
    equal: 'equal',
    bang: 'bang',
    notEqual: 'not_equal',
    greaterThan: 'greater_than',
    greaterThanOrEqual: 'greater_than_or_equal',
    lessThan: 'less_than',
    lessThanOrEqual: 'less_than_or_equal',
    openCurlyBrace: 'open_curly_brace',
    closeCurlyBrace: 'close_curly_brace',
    openParenthesis: 'open_parenthesis',
    closeParenthesis: 'close_parenthesis',
    plus: 'plus',
    hyphen: 'hyphen',
    forwardSlash: 'forward_slash',
    asterisk: 'asterisk',
    comma: 'comma',
    identifier: 'identifier',
    illegal: 'illegal',
    eof: 'eof',
    integer: 'integer',
} as const;

type TTokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

interface IToken {
    type: TTokenType;
    literal: string;
}

class Lexer {
    private currentCharacterPosition: number = 0;
    private readonly tokens: IToken[] = [];
    private text: string = '';

    public convertToTokens(text: string): IToken[] {
        this.text = text;

        const TOKEN_TYPES = this.readTokens();

        this.reset();

        return TOKEN_TYPES;
    }

    private readTokens(): IToken[] {
        const character = this.readCharacter();

        switch (character) {
            case '':
            case ' ':
            case '\n':
            case '\t':
            case '\r': {
                this.consumeCharacter();

                break;
            }

            case '+': {
                this.recordToken(TOKEN_TYPES.plus, character);
                this.consumeCharacter();

                break;
            }

            case '-': {
                this.recordToken(TOKEN_TYPES.hyphen, character);
                this.consumeCharacter();

                break;
            }

            case '/': {
                this.recordToken(TOKEN_TYPES.forwardSlash, character);
                this.consumeCharacter();

                break;
            }

            case '*': {
                this.recordToken(TOKEN_TYPES.asterisk, character);
                this.consumeCharacter();

                break;
            }

            case ',': {
                this.recordToken(TOKEN_TYPES.comma, character);
                this.consumeCharacter();

                break;
            }

            case ';': {
                this.recordToken(TOKEN_TYPES.semicolon, character);
                this.consumeCharacter();

                break;
            }

            case '(': {
                this.recordToken(TOKEN_TYPES.openParenthesis, character);
                this.consumeCharacter();

                break;
            }

            case ')': {
                this.recordToken(TOKEN_TYPES.closeParenthesis, character);
                this.consumeCharacter();

                break;
            }

            case '{': {
                this.recordToken(TOKEN_TYPES.openCurlyBrace, character);
                this.consumeCharacter();

                break;
            }

            case '}': {
                this.recordToken(TOKEN_TYPES.closeCurlyBrace, character);
                this.consumeCharacter();

                break;
            }

            case '=': {
                if (this.peek() === '=') {
                    this.recordToken(TOKEN_TYPES.assignment, character);
                    this.consumeCharacter();
                } else {
                    this.recordToken(TOKEN_TYPES.equal, character);
                }

                this.consumeCharacter();

                break;
            }

            case '!': {
                if (this.peek() === '=') {
                    this.consumeCharacter();
                    this.recordToken(TOKEN_TYPES.notEqual, character);
                } else {
                    this.recordToken(TOKEN_TYPES.bang, character);
                }

                this.consumeCharacter();

                break;
            }

            case '>': {
                if (this.peek() === '=') {
                    this.consumeCharacter();
                    this.recordToken(TOKEN_TYPES.greaterThanOrEqual, character);
                } else {
                    this.recordToken(TOKEN_TYPES.greaterThan, character);
                }

                this.consumeCharacter();

                break;
            }

            case '<': {
                if (this.peek() === '=') {
                    this.consumeCharacter();
                    this.recordToken(TOKEN_TYPES.lessThanOrEqual, character);
                } else {
                    this.recordToken(TOKEN_TYPES.lessThan, character);
                }

                this.consumeCharacter();

                break;
            }

            case '\0': {
                this.recordToken(TOKEN_TYPES.eof, character);
                this.consumeCharacter();

                return this.tokens;
            }

            default: {
                if (isLetter(character)) {
                    const word = this.consumeWord();

                    this.recordToken(
                        word in KEYWORDS ? (word as TTokenType) : TOKEN_TYPES.identifier,
                        word,
                    );

                    break;
                }

                if (isNumber(character)) {
                    this.recordToken(TOKEN_TYPES.integer, this.consumeNumber());

                    break;
                }

                this.recordToken(TOKEN_TYPES.illegal, character);

                this.consumeCharacter();

                break;
            }
        }

        return this.readTokens();
    }

    private recordToken(type: TTokenType, literal: string): void {
        this.tokens.push({ type, literal });
    }

    private consumeWord(): string {
        let word = '';

        while (isLetter(this.readCharacter())) {
            word += this.readCharacter();

            this.consumeCharacter();
        }

        return word;
    }

    private consumeNumber(): string {
        let number = '';

        while (isNumber(this.readCharacter())) {
            number += this.readCharacter();

            this.consumeCharacter();
        }

        return number;
    }

    private readCharacter(position: number = this.currentCharacterPosition): string {
        return position > this.text.length ? '\0' : this.text.charAt(position);
    }

    private consumeCharacter(): void {
        this.currentCharacterPosition += 1;
    }

    private peek(amount: number = 1): string {
        return this.readCharacter(this.currentCharacterPosition + amount);
    }

    private reset(): void {
        this.text = '';
        this.currentCharacterPosition = 0;
    }
}

export { Lexer };
