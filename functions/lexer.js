const { Lexer } = require('@aroleaf/parser');

const lexer = new Lexer();

let depth = 0;

lexer
  .token('{')
  .matches('{')
  .then(() => depth++);

lexer
  .token('}*')
  .matches(/}(.*)$/s)
  .and(() => depth <= 1)
  .then(() => depth--);

lexer
  .token('}')
  .matches('}')
  .then(() => depth--);

lexer
  .token('[')
  .matches('[');

lexer
  .token(']')
  .matches(']');

lexer
  .token('(')
  .matches('(');

lexer
  .token(')')
  .matches(')');

lexer
  .token('separator')
  .matches(',');

lexer
  .token('kv')
  .matches(/=|:/);

lexer
  .token('string')
  .matches(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/s)
  .then((t) => {
    t.value = t.value.slice(1,-1).replace(/\\([^])/g, sub => {
      switch(sub[1]) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'v': return '\v';
        case 'b': return '\b';
        case 'f': return '\f';
        default: return sub[1];
      }
    });
  });

lexer
  .token('number')
  .matches(/(?:\d*\.)?\d+(?:e-?\d+)?/)

lexer
  .token('identifier')
  .matches(/[a-zA-Z_]\w*/);

lexer
  .token('whitespace')
  .matches(/\s+/s)
  .discard();

module.exports = (input) => {
  return lexer.parse(input);
};