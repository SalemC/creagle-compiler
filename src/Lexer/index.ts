import { type TTokenType, type IToken } from './types';
import { KEYWORDS, TOKEN_TYPES } from './tokenTypes';
import { isLetter } from './helpers/isLetter';
import { isNumber } from './helpers/isNumber';

class Lexer {
    private currentCharacterPosition: number = 0;
    private readonly tokens: IToken[] = [];
    private text: string = '';

    public convertToTokens(text: string): IToken[] {
        this.reset();

        this.text = text;

        return this.readTokens();
    }

    private readTokens(): IToken[] {
        const character = this.peek();

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
                if (this.peek(1) === '=') {
                    this.recordToken(TOKEN_TYPES.assignment, character);
                    this.consumeCharacter();
                } else {
                    this.recordToken(TOKEN_TYPES.equal, character);
                }

                this.consumeCharacter();

                break;
            }

            case '!': {
                if (this.peek(1) === '=') {
                    this.consumeCharacter();
                    this.recordToken(TOKEN_TYPES.notEqual, character);
                } else {
                    this.recordToken(TOKEN_TYPES.bang, character);
                }

                this.consumeCharacter();

                break;
            }

            case '>': {
                if (this.peek(1) === '=') {
                    this.consumeCharacter();
                    this.recordToken(TOKEN_TYPES.greaterThanOrEqual, character);
                } else {
                    this.recordToken(TOKEN_TYPES.greaterThan, character);
                }

                this.consumeCharacter();

                break;
            }

            case '<': {
                if (this.peek(1) === '=') {
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

        while (isLetter(this.peek())) {
            word += this.peek();

            this.consumeCharacter();
        }

        return word;
    }

    private consumeNumber(): string {
        let number = '';

        while (isNumber(this.peek())) {
            number += this.peek();

            this.consumeCharacter();
        }

        return number;
    }

    private consumeCharacter(): void {
        this.currentCharacterPosition += 1;
    }

    private peek(offset: number = 0): string {
        const position = this.currentCharacterPosition + offset;

        return position > this.text.length ? '\0' : this.text.charAt(position);
    }

    private reset(): void {
        this.text = '';
        this.tokens.length = 0;
        this.currentCharacterPosition = 0;
    }
}

export { Lexer };
