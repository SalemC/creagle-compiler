import util from 'util';
import fs from 'fs';

import { Generator } from './Generator';
import { Parser } from './Parser';
import { Lexer } from './Lexer';

const lexer = new Lexer();
const parser = new Parser();
const generator = new Generator();

console.info('Lexing...');
const tokens = lexer.convertToTokens(`
    mutable byte variable = 0;

    if (1) {
        variable = 1;
    }

    terminate(variable);
`);
console.log(tokens);

console.info('Parsing...');
const statements = parser.parseTokens(tokens);
console.log(util.inspect(statements, { showHidden: false, depth: null, colors: true }));

console.info('Assembling...');
const assembly = generator.generateAssembly(statements);
console.log(assembly);

fs.writeFileSync('build/output.asm', assembly);
