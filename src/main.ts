import { Lexer } from './Lexer';
import { Parser } from './Parser';

import util from 'util';

const lexer = new Lexer();

const tokens = lexer.convertToTokens(`
    const value = 420;

    return value;
`);

console.log(tokens);

const parser = new Parser();

const statements = parser.parseTokens(tokens);

console.log(util.inspect(statements, { showHidden: false, depth: null, colors: true }));
