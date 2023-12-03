import util from 'util';
import fs from 'fs';

import { Generator } from './Generator';
import { Parser } from './Parser';
import { Lexer } from './Lexer';

const lexer = new Lexer();
const parser = new Parser();
const generator = new Generator();

const filePath = process.argv[2];

if (filePath === undefined) {
    throw new Error('Please specify a file path.');
}

console.info('Lexing...');
const tokens = lexer.convertToTokens(fs.readFileSync(filePath).toString('utf8'));
console.log(tokens);

console.info('\nParsing...');
const statements = parser.parseTokens(tokens);
console.log(util.inspect(statements, { showHidden: false, depth: null, colors: true }));

console.info('\nAssembling...');
const assembly = generator.generateAssembly(statements);
console.log(assembly);

fs.writeFileSync('build/output.asm', assembly);
