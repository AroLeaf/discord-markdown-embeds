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

export class QuoteNode extends Node {
  render(options = {}) {
    return options.html 
      ? `<blockquote>${this.children.map(item => super.render(options, item)).join('\n')}</blockquote>`
      : this.children.map(item => `> ${super.render(options, item)}`).join('\n');
  }
}

export const ListNode = ordered => class extends Node {
  ordered = ordered;
  render({ ul = '• ', ol = 'n. ', ...options } = {}) {
    const marker = (this.ordered)
      ? (typeof ol === 'string') ? n => ol.replace('n', n) : ol
      : (typeof ol === 'string') ? () => ul : ul;
    
    return this.children.map((item, i) => `${marker(i)}${super.render(options, item)}`).join('\n');
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

  render(options = {}) {
    return options.html 
      ? `<a href="${this.link}" title="${this.title}">${super.render(options)}</a>`
      : `[${super.render(options)}](${this.link}${this.title ? ` '${this.title.replace(/[\\']/g, '\\$&')}'` : ''})`;
  }
}
export class ImageNode extends LinkNode {
  render() {
    return this.link;
  }
}

export class CodeBlockNode extends Node {
  constructor(input) {
    super();
    const [lang, code] = input.split(/\n(.*)/s);
    console.log('lang:', lang.length, '\ncode:', code);
    if (!code || /[^\w]/.test(lang)) {
      this.code = input;
      this.lang = 'plaintext';
    } else {
      this.code = code;
      this.lang = lang;
    }
  }

  render(options = {}) {
    return options.html
      ? `<pre class="language-${this.lang}"><code>${this.code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')}</code></pre>`
      : '```' + `${this.lang}\n${this.code}` + '```';
  }
}
export class InlineCodeNode extends Node {
  constructor(code) {
    super();
    this.code = code;
  }

  render(options = {}) {
    return options.html 
      ? `<code>${this.code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')}</code>`
      : '`' + this.code + '`';
  }
}

export const StyleNode = sep => class extends Node {
  sep = sep;
  render(options = {}) {
    if (!options.html) return super.render(options, [sep, ...this.children, sep]);
    const tags = {
      '**': ['<b>', '</b>'],
      '__': ['<span style="text-decoration:underline;>"', '</span>'],
      '~~': ['<s>', '</s>'],
      '_': ['<i>', '</i>'],
    }
    return `${tags[sep][0]}${super.render(options)}${tags[sep][1]}`;
  }
}

export class ParagraphNode extends Node {
  render(options = {}) {
    return options.html
      ? super.render(options, ['<p>', ...this.children, '</p>'])
      : super.render(options);
  }
}
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

  render(options = {}) {
    return options.html 
      ? this.text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
      : this.text;
  }
}

export default {
  document: DocumentNode,
  command: CommandNode,
  unorderedList: ListNode(false),
  orderedList: ListNode(true),
  quote: QuoteNode,
  title: TitleNode,
  link: LinkNode,
  image: ImageNode,
  codeBlock: CodeBlockNode,
  inlineCode: InlineCodeNode,
  bold: StyleNode('**'),
  underline: StyleNode('__'),
  italics: StyleNode('_'),
  strikethrough: StyleNode('~~'),
  whitespace: WhitespaceNode,
  paragraph: ParagraphNode,
  text: TextNode,
}