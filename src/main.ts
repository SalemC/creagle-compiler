import { Lexer } from './Lexer';

const lexer = new Lexer();

const tokens = lexer.convertToTokens(`
    const value = 420;

    if (value == 69) {
        return true;
    } else {
        return false;
    }
`);

console.log(tokens);
