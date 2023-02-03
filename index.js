const parser = require('./parser.js');
const renderer = require('./renderers/embeds.js');
const reverser = require('./renderers/reverse.js');

module.exports = {
  render(markdown, options = {}) {
    return renderer.render(parser.parse(markdown), { as: 'markdown', ...options });
  },
  renderHTML(markdown, options = {}) {
    return renderer.render(parser.parse(markdown), { ...options, as: 'html' });
  },

  renderInline(markdown, options) {
    return renderer.inline.markdown(parser.parse(markdown, { inline: true }), options);
  },

  renderInlineHTML(markdown, options) {
    return renderer.inline.html(parser.parse(markdown, { inline: true }), options);
  },

  template(markdown) {
    return {
      AST: parser.parse(markdown),
      render(options = {}) {
        return renderer.render(this.AST, { as: 'markdown', ...options });
      },
      renderHTML(options = {}) {
        return renderer.render(this.AST, { ...options, as: 'html' });
      },
    }
  },

  reverse(messageOrEmbeds) {
    if (typeof messageOrEmbeds === 'string') messageOrEmbeds = JSON.parse(messageOrEmbeds);
    return Array.isArray(messageOrEmbeds) ? reverser.reverseEmbeds(messageOrEmbeds) : reverser.reverseMessage(messageOrEmbeds);
  },

  parser, renderer, reverser,
}