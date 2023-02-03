const { Node } = require('@aroleaf/parser');

const program = new Node('program');
const property = new Node('property');
const call = new Node('call');
const object = new Node('object');
const array = new Node('array');
const variable = new Node('variable');
const literal = new Node('literal');

const nestables = [property, call, object, array, variable, literal];

program.is(ctx => {
  ctx.discard('{');
  ctx.expect(...nestables);
  ctx.discard('}', '}*');
});

property.is(ctx => {
  ctx.expect(call, object, array, variable);
  const once = () => {
    if (ctx.ignore('[')) {
      ctx.expect(...nestables);
      ctx.discard(']');
    } else {
      ctx.discard('prop');
      ctx.expect('identifier');
    }
  }
  once();
  while(ctx.assert('prop') || ctx.assert('[')) once();
});

call.is(ctx => {
  ctx.expect('identifier');
  ctx.discard('(');
  if (ctx.accept(...nestables)) while(ctx.ignore('separator')) ctx.accept(...nestables);
  ctx.discard(')');
});

object.is(ctx => {
  ctx.discard('{');
  while(ctx.accept('string', 'number', 'identifier')) {
    ctx.discard('kv');
    ctx.expect(...nestables);
    if (!ctx.ignore('separator')) break;
  }
  ctx.discard('}');
});

array.is(ctx => {
  ctx.discard('[');
  while(ctx.accept(...nestables) && ctx.ignore('separator'));
  ctx.discard(']');
});

variable.is(ctx => ctx.expect('identifier'));
literal.is(ctx => ctx.expect('string', 'number'));

module.exports = tokens => program.parse(tokens);