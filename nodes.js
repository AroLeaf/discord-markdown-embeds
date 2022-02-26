import Renderer from './renderer.js';

export class Node {
  constructor(children = []) {
    this.children = children;
  }

  render(options = {}, nodes = this.children) {
    return nodes.map(node => node.render?.(options) || node).join('');
  }
}

export class DocumentNode extends Node {
  render(options) {
    return new Renderer(this).render(options);
  }
}

export class CommandNode extends Node {
  constructor(input) {
    super();
    const sep = input.search(':');
    this.command = sep >= 0 ? input.slice(0, sep) : input;
    this.args = (sep >= 0 ? input.slice(sep + 1) : '').split(',');
  }

  render({ commands = {} } = {}) {
    const command = commands[this.command];
    if (!command) throw new Error(`command ${this.command} not found!`);
    return typeof command === 'function' ? command(...this.args) : command.toString();
  }
}

export const ListNode = ordered => class extends Node {
  ordered = ordered;
  render({ list = '● ', ...options} = {}) {
    return this.children.map(item => `${list}${super.render(options, item)}`).join('\n');
  }
}

export class TitleNode extends Node {
  constructor(children, type) {
    super(children);
    this.type = type;
  }
}

export class LinkNode extends Node {
  constructor(label, link, title) {
    super(label);
    this.link = link;
    this.title = title;
  }

  render(options) {
    return `[${super.render(options)}](${this.link}${this.title ? ` '${this.title.replace(/[\\']/g, '\\$&')}'` : ''})`
  }
}
export class ImageNode extends LinkNode {
  render(options) {
    return this.link;
  }
}

export class CodeBlockNode extends Node {
  constructor(code) {
    super();
    this.code = code;
  }

  render() {
    return '```' + this.code + '```';
  }
}
export class InlineCodeNode extends Node {
  constructor(code) {
    super();
    this.code = code;
  }

  render() {
    return '`' + this.code + '`';
  }
}

export const StyleNode = sep => class extends Node {
  sep = sep;
  render() {
    return super.render([sep, ...this.children, sep]);
  }
}

export class ParagraphNode extends Node {} // maybe needs whitespace collapse
export class WhitespaceNode extends Node {
  constructor(newlines) {
    super();
    this.newlines = newlines;
  }

  render() {
    return ' ';
  }
}
export class TextNode extends Node {
  constructor(text) {
    super();
    this.text = text;
  }

  render() {
    return this.text;
  }
}

export default {
  document: DocumentNode,
  command: CommandNode,
  unorderedList: ListNode(false),
  orderedList: ListNode(true),
  title: TitleNode,
  link: LinkNode,
  image: ImageNode,
  codeBlock: CodeBlockNode,
  inlineCode: InlineCodeNode,
  bold: StyleNode('**'),
  underline: StyleNode('__'),
  italics: StyleNode('*'),
  strikethrough: StyleNode('~~'),
  whitespace: WhitespaceNode,
  paragraph: ParagraphNode,
  text: TextNode,
}