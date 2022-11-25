const tokenize = require('./lexer.js');
const parse = require('./parser.js');
const interpret = require('./interpreter.js');

module.exports = {
  tokenize(source) {
    if (!source.startsWith('{')) return false;
    const tokens = tokenize(source);
    return tokens.at(-1).type === '}*' && tokens;
  },

  parse(tokens) {
    return interpret(parse(tokens));
  },
};