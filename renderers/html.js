const SimpleMarkdown = require('@khanacademy/simple-markdown');
const { rules } = require('../parser.js');

module.exports = SimpleMarkdown.outputFor(rules, 'html');