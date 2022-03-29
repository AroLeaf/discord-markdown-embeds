import Lexer from './lexer.js';
import Parser from './parser.js';
import fs from 'fs/promises';

const input = await fs.readFile('test.md', 'utf8')
const start = process.hrtime.bigint();

const tokens = new Lexer(input).parse();
const lexed = process.hrtime.bigint();

const tree = new Parser(tokens).parse();
const parsed = process.hrtime.bigint();

const render = tree.render({ html: true });
const rendered = process.hrtime.bigint();

console.log(tokens);
console.log(JSON.stringify(tree, null, 2));
console.log(render);
console.log('');
console.log(render.messages().map(m => JSON.stringify(m)).join('\n\n'));
console.log('');

console.log('lexing took    : %dms', Number(lexed - start)     / 1_000_000);
console.log('parsing took   : %dms', Number(parsed - lexed)    / 1_000_000);
console.log('rendering took : %dms', Number(rendered - parsed) / 1_000_000);
console.log('total time     : %dms', Number(rendered - start)  / 1_000_000);