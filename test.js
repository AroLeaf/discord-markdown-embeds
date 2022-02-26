import Lexer from './lexer.js';
import Parser from './parser.js';
import fs from 'fs/promises';

const input = await fs.readFile('readme.md', 'utf-8')
const start = Date.now();

const tokens = new Lexer(input).parse();
const lexed = Date.now();

const tree = new Parser(tokens).parse();
const parsed = Date.now();

const render = tree.render();
const rendered = Date.now();

console.log(render);
console.log('');
console.log(render.messages().map(m => JSON.stringify(m)).join('\n\n'));
console.log('');

console.log('lexing took    : %dms', lexed - start);
console.log('parsing took   : %dms', parsed - lexed);
console.log('rendering took : %dms', rendered - parsed);
console.log('total time     : %dms', rendered - start);