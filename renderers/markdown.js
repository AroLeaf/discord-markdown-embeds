const renderer = {
  render(node) {
    if (Array.isArray(node)) return node.map(item => this.render(item)).join('');
    
    switch (node.type) {
      case 'link': return this.link(node);
      case 'image': return this.image(node);
      case 'em': return this.italics(node);
      case 'strong': return this.bold(node);
      case 'u': return this.underline(node);
      case 'del': return this.strikethrough(node);
      case 'inlineCode': return this.code(node);
      case 'mention': return this.mention(node);
      case 'text': return this.text(node);
      default: throw new Error(`${node.type} not implemented!`);
    }
  },

  link(node) {
    return `[${this.render(node.content)}](${node.target}, '${node.title}')`;
  },

  image(node) {
    return `[${node.alt}](${node.target}, '${node.title}')`;
  },

  italics(node) {
    return `*${this.render(node.content)}*`;
  },

  bold(node) {
    return `**${this.render(node.content)}**`;
  },

  underline(node) {
    return `__${this.render(node.content)}__`;
  },

  strikethrough(node) {
    return `~~${this.render(node.content)}~~`;
  },

  code(node) {
    return `\`${node.content}\``;
  },

  mention(node) {
    switch (node.mentionType) {
      case 'user': return `<@${node.id}>`;
      case 'role': return `<@&${node.id}>`;
      case 'channel': return `<#${node.id}>`;
      case 'command': return `<${node.name}:${node.id}>`;
      case 'emoji': return `<${node.animated ? 'a': ''}:${node.name[0]}:${node.id}>`;
      case 'timestamp': return `<t:${node.timestamp}:${node.format === 'f' ? '' : `:${node.format}`}>`;
    }
  },

  text(node) {
    return node.content;
  },
}

module.exports = node => renderer.render(node);