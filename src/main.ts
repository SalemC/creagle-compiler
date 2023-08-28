import { Lexer } from './Lexer';
import { Parser } from './Parser';

const lexer = new Lexer();

const tokens = lexer.convertToTokens(`
    const value = 420;

    return value;
`);

console.log(tokens);

const parser = new Parser();

const statements = parser.parseTokens(tokens);

console.log(JSON.stringify(statements));
