const SimpleMarkdown = require('@khanacademy/simple-markdown/dist/index.js');
const { rules } = require('../parser.js');

const renderer = SimpleMarkdown.outputFor(rules, 'html');

module.exports = (AST, options) => renderer(AST, { options });