const parser = require('../parser.js');
const renderer = require('../renderers/embeds.js');

module.exports = {
  __parse(input, options) {
    const AST = typeof input === 'string' ? parser.parse(input) : input;
    return renderer.array(AST, options);
  },
};