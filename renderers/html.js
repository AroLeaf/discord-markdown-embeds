const SimpleMarkdown = require('@khanacademy/simple-markdown');
const { rules } = require('../parser.js');

const renderer = SimpleMarkdown.outputFor(rules, 'html');

module.exports = (AST, options) => renderer(AST, { options });