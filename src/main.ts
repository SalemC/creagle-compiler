import util from 'util';

import { Parser } from './Parser';
import { Lexer } from './Lexer';

const lexer = new Lexer();
const parser = new Parser();

const tokens = lexer.convertToTokens(`
    const value = 420;

    terminate(value);
`);
console.log(tokens);
const statements = parser.parseTokens(tokens);
console.log(util.inspect(statements, { showHidden: false, depth: null, colors: true }));
