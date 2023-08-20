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

const TOKENS = {
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

type TToken = (typeof TOKENS)[keyof typeof TOKENS];

interface IToken {
    type: TToken;
    literal: string;
}

class Lexer {
    private currentCharacterPosition: number = 0;
    private readonly tokens: IToken[] = [];
    private text: string = '';

    public convertToTokens(text: string): IToken[] {
        this.text = text;

        const tokens = this.readTokens();

        this.reset();

        return tokens;
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
                this.tokens.push({ type: TOKENS.plus, literal: character });

                this.consumeCharacter();

                break;
            }

            case '-': {
                this.tokens.push({ type: TOKENS.hyphen, literal: character });

                this.consumeCharacter();

                break;
            }

            case '/': {
                this.tokens.push({ type: TOKENS.forwardSlash, literal: character });

                this.consumeCharacter();

                break;
            }

            case '*': {
                this.tokens.push({ type: TOKENS.asterisk, literal: character });

                this.consumeCharacter();

                break;
            }

            case ',': {
                this.tokens.push({ type: TOKENS.comma, literal: character });

                this.consumeCharacter();

                break;
            }

            case ';': {
                this.tokens.push({ type: TOKENS.semicolon, literal: character });

                this.consumeCharacter();

                break;
            }

            case '(': {
                this.tokens.push({ type: TOKENS.openParenthesis, literal: character });

                this.consumeCharacter();

                break;
            }

            case ')': {
                this.tokens.push({ type: TOKENS.closeParenthesis, literal: character });

                this.consumeCharacter();

                break;
            }

            case '{': {
                this.tokens.push({ type: TOKENS.openCurlyBrace, literal: character });

                this.consumeCharacter();

                break;
            }

            case '}': {
                this.tokens.push({ type: TOKENS.closeCurlyBrace, literal: character });

                this.consumeCharacter();

                break;
            }

            case '=': {
                if (this.peek() === '=') {
                    this.tokens.push({ type: TOKENS.assignment, literal: character });

                    this.consumeCharacter();
                } else {
                    this.tokens.push({ type: TOKENS.equal, literal: character });
                }

                this.consumeCharacter();

                break;
            }

            case '!': {
                if (this.peek() === '=') {
                    this.consumeCharacter();

                    this.tokens.push({ type: TOKENS.notEqual, literal: character });
                } else {
                    this.tokens.push({ type: TOKENS.bang, literal: character });
                }

                this.consumeCharacter();

                break;
            }

            case '>': {
                if (this.peek() === '=') {
                    this.consumeCharacter();

                    this.tokens.push({ type: TOKENS.greaterThanOrEqual, literal: character });
                } else {
                    this.tokens.push({ type: TOKENS.greaterThan, literal: character });
                }

                this.consumeCharacter();

                break;
            }

            case '<': {
                if (this.peek() === '=') {
                    this.consumeCharacter();

                    this.tokens.push({ type: TOKENS.lessThanOrEqual, literal: character });
                } else {
                    this.tokens.push({ type: TOKENS.lessThan, literal: character });
                }

                this.consumeCharacter();

                break;
            }

            case '\0': {
                this.tokens.push({ type: TOKENS.eof, literal: character });

                this.consumeCharacter();

                return this.tokens;
            }

            default: {
                if (isLetter(character)) {
                    const word = this.consumeWord();

                    if (word in KEYWORDS) {
                        this.tokens.push({ type: word as TToken, literal: word });
                    } else {
                        this.tokens.push({ type: TOKENS.identifier, literal: word });
                    }

                    break;
                }

                if (isNumber(character)) {
                    const number = this.consumeNumber();

                    this.tokens.push({ type: TOKENS.integer, literal: number });

                    break;
                }

                this.tokens.push({ type: TOKENS.illegal, literal: character });

                this.consumeCharacter();

                break;
            }
        }

        return this.readTokens();
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
