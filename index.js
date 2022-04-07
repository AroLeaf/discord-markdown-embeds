import _Lexer from './lexer.js';
import _Parser from './parser.js';
import _Renderer from './renderer.js';

export const Lexer = _Lexer;
export const Parser = _Parser;
export const Renderer = _Renderer;

export function render(md, options) {
  return template(md).render(options)
}

export function template(md) {
  return new Parser(new Lexer(md).parse()).parse();
}

export default {
  render, template,
  Lexer, Parser, Renderer,
}