import util from 'util';
import fs from 'fs';

import { Optimiser } from './Optimiser';
import { Generator } from './Generator';
import { Parser } from './Parser';
import { Lexer } from './Lexer';

const lexer = new Lexer();
const parser = new Parser();
const generator = new Generator();
const optimiser = new Optimiser();

const filePath = process.argv[2];

if (filePath === undefined) {
    throw new Error('Please specify a file path.');
}

if (!filePath.endsWith('.creagle')) {
    throw new Error('Please specify a path to a valid creagle file.');
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

console.info('\nOptimising...');
const optimisedAssembly = optimiser.optimiseAssembly(assembly);
console.log(optimisedAssembly);

fs.writeFileSync('build/output.asm', assembly);
