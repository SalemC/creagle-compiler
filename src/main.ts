import util from 'util';
import fs from 'fs';

import { Generator } from './Generator';
import { Parser } from './Parser';
import { Lexer } from './Lexer';

const lexer = new Lexer();
const parser = new Parser();
const generator = new Generator();

const tokens = lexer.convertToTokens(`
    const value = 10 + 20 - 30;

    terminate(value);
`);
console.log(tokens);
const statements = parser.parseTokens(tokens);
console.log(util.inspect(statements, { showHidden: false, depth: null, colors: true }));
const assembly = generator.generateAssembly(statements);
console.log(assembly);

fs.writeFile('build/output.asm', assembly, () => {
    //
});
