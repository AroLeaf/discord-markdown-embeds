const parser = require('./parser.js');
const renderer = require('./renderers/embeds.js');

module.exports = {
  render(markdown, options = {}) {
    return renderer.render(parser.parse(markdown), { as: 'markdown', ...options });
  },
  renderHTML(markdown, options = {}) {
    return renderer.render(parser.parse(markdown), { ...options, as: 'html' });
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

  parser, renderer,
}