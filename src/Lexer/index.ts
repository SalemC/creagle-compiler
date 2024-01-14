import { type TTokenType, type IToken, type ILocation } from './types';
import { KEYWORDS, TOKEN_TYPES } from './tokenTypes';
import { isLetter } from './helpers/isLetter';
import { isNumber } from './helpers/isNumber';

class Lexer {
    private readonly currentLocation: ILocation = { row: 0, column: 0 };
    private readonly tokens: IToken[] = [];
    private cursorPosition: number = 0;
    private text: string = '';

    public convertToTokens(text: string): IToken[] {
        this.text = text;

        return this.readTokens();
    }

    private readTokens(): IToken[] {
        const character = this.peek();

        switch (character) {
            case '':
            case ' ':
            case '\t': {
                this.consumeCharacter();

                break;
            }

            // Carriage return character moves the cursor to the beginning of the line.
            case '\r': {
                this.consumeCharacter();

                this.currentLocation.column = 0;

                break;
            }

            // Line feed character moves the cursor down a line without returning to the beginning of the line.
            case '\n': {
                this.consumeCharacter();

                // If there's no previous carriage return character, we're parsing an LF file and therefore need to treat
                // the line feed character like a carriage return character as well.
                if (this.peek(-1) !== '\r') {
                    this.currentLocation.column = 0;
                }

                this.currentLocation.row += 1;

                break;
            }

            case '\0': {
                this.recordToken(TOKEN_TYPES.eof, character);
                this.consumeCharacter();

                return this.tokens;
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
                this.consumeCharacter();

                if (this.peek() === '/') {
                    this.consumeCharacter();

                    // Consume all characters until we reach a new line or the end of the file.
                    while (this.peek() !== '\n' && this.peek() !== '\0') {
                        this.consumeCharacter();
                    }
                } else {
                    this.recordToken(TOKEN_TYPES.forwardSlash, character);
                }

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
                    this.recordToken(TOKEN_TYPES.equal, character);
                    this.consumeCharacter();
                } else {
                    this.recordToken(TOKEN_TYPES.assignment, character);
                }

                this.consumeCharacter();

                break;
            }

            case '!': {
                if (this.peek(1) === '=') {
                    this.recordToken(TOKEN_TYPES.notEqual, character);
                    this.consumeCharacter();
                } else {
                    this.recordToken(TOKEN_TYPES.bang, character);
                }

                this.consumeCharacter();

                break;
            }

            case '>': {
                if (this.peek(1) === '=') {
                    this.recordToken(TOKEN_TYPES.greaterThanOrEqual, character);
                    this.consumeCharacter();
                } else {
                    this.recordToken(TOKEN_TYPES.greaterThan, character);
                }

                this.consumeCharacter();

                break;
            }

            case '<': {
                if (this.peek(1) === '=') {
                    this.recordToken(TOKEN_TYPES.lessThanOrEqual, character);
                    this.consumeCharacter();
                } else {
                    this.recordToken(TOKEN_TYPES.lessThan, character);
                }

                this.consumeCharacter();

                break;
            }

            default: {
                if (isLetter(character)) {
                    const word = this.consumeWord();

                    this.recordToken(
                        word in KEYWORDS ? (word as TTokenType) : TOKEN_TYPES.identifier,
                        word,
                        this.currentLocation.column - word.length,
                    );

                    break;
                }

                if (isNumber(character)) {
                    const num = this.consumeNumber();

                    this.recordToken(
                        TOKEN_TYPES.integer,
                        num,
                        this.currentLocation.column - num.length,
                    );

                    break;
                }

                this.recordToken(TOKEN_TYPES.illegal, character);

                this.consumeCharacter();

                break;
            }
        }

        return this.readTokens();
    }

    private recordToken(
        type: TTokenType,
        literal: string,
        column: number = this.currentLocation.column,
        row: number = this.currentLocation.row,
    ): void {
        this.tokens.push({
            type,
            literal,
            location: {
                column,
                row,
            },
        });
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
        this.cursorPosition += 1;
        this.currentLocation.column += 1;
    }

    private peek(offset: number = 0): string {
        const position = this.cursorPosition + offset;

        return position > this.text.length ? '\0' : this.text.charAt(position);
    }
}

export { Lexer };
