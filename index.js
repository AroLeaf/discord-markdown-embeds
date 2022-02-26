import _Lexer from './lexer.js';
import _Parser from './parser.js';
import _Renderer from './renderer.js';

export const Lexer = _Lexer;
export const Parser = _Parser;
export const Renderer = _Renderer;

export default {
  render(md, options) {
    return this.template(md).render(options)
  },

  template(md) {
    return new Parser(new Lexer(md).parse()).parse();
  }
}