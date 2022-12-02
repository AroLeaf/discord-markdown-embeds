const renderer = {
  render(node, options) {
    if (Array.isArray(node)) return node.map(item => this.render(item)).join('');
    
    switch (node.type) {
      case 'function': return this.function(node, options);
      case 'link': return this.link(node, options);
      case 'image': return this.image(node, options);
      case 'em': return this.italics(node, options);
      case 'strong': return this.bold(node, options);
      case 'u': return this.underline(node, options);
      case 'del': return this.strikethrough(node, options);
      case 'inlineCode': return this.code(node, options);
      case 'mention': return this.mention(node, options);
      case 'br': return this.br(node, options);
      case 'text': return this.text(node, options);
      default: throw new Error(`${node.type} not implemented!`);
    }
  },

  function(node, options) {
    try {
      return node.func(options);
    } catch (error) {
      return error.toString();
    }
  },

  link(node, options) {
    return `[${this.render(node.content, options)}](${node.target}, '${node.title}')`;
  },

  image(node, options) {
    return `[${node.alt}](${node.target}, '${node.title}')`;
  },

  italics(node, options) {
    const content = this.render(node.content, options);
    const char = content.startsWith(' ') || content.endsWith(' ') ? '_' : '*';
    return char + content + char;
  },

  bold(node, options) {
    return `**${this.render(node.content, options)}**`;
  },

  underline(node, options) {
    return `__${this.render(node.content, options)}__`;
  },

  strikethrough(node, options) {
    return `~~${this.render(node.content, options)}~~`;
  },

  code(node, options) {
    return `\`${node.content}\``;
  },

  mention(node, options) {
    switch (node.mentionType) {
      case 'user': return `<@${node.id}>`;
      case 'role': return `<@&${node.id}>`;
      case 'channel': return `<#${node.id}>`;
      case 'command': return `<${node.name}:${node.id}>`;
      case 'emoji': return `<${node.animated ? 'a': ''}:${node.name[0]}:${node.id}>`;
      case 'timestamp': return `<t:${node.timestamp}:${node.format === 'f' ? '' : `:${node.format}`}>`;
    }
  },

  br(node, options) {
    return '\n';
  },

  text(node, options) {
    return node.content;
  },
}

module.exports = node => renderer.render(node);