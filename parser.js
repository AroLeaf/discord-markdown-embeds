import nodes from './nodes.js';
import types from './tokens.js';

export default class Parser {
  constructor(tokens, { type = nodes.document, pos = 0 } = {}) {
    this.pos = pos;
    this.tokens = tokens;
    this.type = type;
    this.nodes = [];
  }

  find(pred, cb) {
    const index = this.tokens.slice(this.pos + 1).findIndex(pred) + this.pos + 1
    return index > this.pos && cb(index);
  }

  wraps(pred, cb, matchEnd = false) {
    return this.find(pred, index => cb(this.tokens.slice(this.pos + 1, index)) ?? true)
      || ((matchEnd && cb(this.tokens.slice(this.pos + 1))) ?? true);
  }

  push(node) {
    this.nodes.push(node);
  }

  paragraph() {
    this.wraps(t =>
      (t.type === types.whitespace && t.value > 1)
      || t.type === types.title
      || (t.type === types.link.start && t.value)
    , children => {
      if (!children.length) return this.pos++;
      this.push(new Parser(children, {
        type: nodes.paragraph,
      }).parse());
      this.pos += children.length + 1;
    }, true);
  }

  parse() {
    {
      const token = this.tokens[this.pos];
      if (token && !(
        token.type === types.title ||
        token.type === types.whitespace && token.value > 1 ||
        token.type === types.link.start && token.value
      ) && this.type === nodes.document) {
        this.wraps(t =>
          (t.type === types.whitespace && t.value > 1)
          || t.type === types.title
          || (t.type === types.link.start && t.value)
        , children => {
          this.push(new Parser(children.concat(token), {
            type: nodes.paragraph,
          }).parse());
          this.pos += children.length + 1;
        }, true);
      };
    }
    

    while(this.tokens[this.pos]) {
      const token = this.tokens[this.pos];
      switch(token.type) {
        // command
        case types.command: {
          this.push(new nodes.command(token.value));
          this.pos++; break;
        }
        
        // lists helper function
        function splitArray(array, pred) {
          array = [...array];
          const out = [];
          while (true) {
            const index = array.findIndex(pred);
            if (index < 0) {
              out.push(array);
              break;
            }
            out.push(array.slice(0, index));
            array = array.slice(index + 1, array.length);
          }
          return out;
        }

        // unordered list
        case types.list.unordered: {
          if (this.wraps(t =>
            (t.type === types.whitespace && t.value > 1)
            || (t.type === types.list.unordered && t.value !== token.value)
            || t.type === types.list.ordered
            || t.type === types.title
            || t.type === types.code.block
            || t.type === types.quote
          , children => {
            const items = splitArray(children, t => t.type === types.list.unordered);
            this.push(new nodes.unorderedList(items.map(i => new Parser(i, { type: 'inline' }).parse())));
            this.pos += children.length + 1;
          }, true)) break;

          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        // ordered list
        case types.list.ordered: {
          if (this.wraps(t =>
            (t.type === types.whitespace && t.value > 1)
            || t.type === types.list.unordered
            || t.type === types.title
            || t.type === types.code.block
            || t.type === types.quote
          , children => {
            const items = splitArray(children, t => t.type === types.list.ordered);
            this.push(new nodes.orderedList(items.map(i => new Parser(i, { type: 'inline' }).parse())));
            this.pos += children.length + 1;
          }, true)) break;

          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        case types.quote: {
          if (this.wraps(t => 
            (t.type === types.whitespace && t.value > 1)
            || t.type === types.list.unordered
            || t.type === types.list.ordered  
            || t.type === types.title
            || t.type === types.code.block
          , children => {
            const items = splitArray(children, t => t.type === types.quote);
            this.push(new nodes.quote(items.map(i => new Parser(i, { type: 'inline' }).parse())));
            this.pos += children.length + 1;
          }, true)) break;

          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        // title
        case types.title: {
          if (this.wraps(t => t.type === types.whitespace && t.value > 0, children => {
            this.push(new nodes.title(new Parser(children, {
              type: 'inline',
            }).parse(), token.value));
            this.pos += children.length + 1;
          }, true)) { this.paragraph(); break; }
          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        // link
        case types.link.start: {
          const type = token.value ? nodes.image : nodes.link;
          let label, link, title;
          this.wraps(t => t.type === types.link.middle, children => {
            label = new Parser(children, { type: 'inline' }).parse();
            this.pos += children.length + 1;
          });
          if (!label) {
            this.push(new nodes.text(token.raw));
            this.pos++; break;
          }
          this.wraps(t => t.type === types.link.end, children => {
            const idx = children.findIndex(c => c.type === types.whitespace);
            if (idx < 0) {
              link = children.map(c => c.raw).join('');
            } else {
              link = children.slice(0, idx).map(c => c.raw).join('');
              title = children.slice(idx+1).map(c => c.raw).join('');
            }
            this.pos += children.length + 2;
          });
          this.push(new type(label, link, title));
          if (label && token.value) this.paragraph();
          break;
        }
        // loose link ends
        case types.link.middle:
        case types.link.end: {
          this.push(new nodes.text(token.raw));
          this.pos++; break;
          // throw new Error('unexpected token:', token);
        }

        // code block
        case types.code.block: {
          this.push(new nodes.codeBlock(token.value));
          this.pos++; break;
        }
        
        // inline code
        case types.code.inline: {
          this.push(new nodes.inlineCode(token.value));
          this.pos++; break;
        }
        
        // bold
        case types.bold: {
          if (this.wraps(t => t.type === types.bold, children => {
            this.push(new Parser(children, {
              type: nodes.bold,
            }).parse());
            this.pos += children.length + 2;
          })) break;

          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        // underline
        case types.underline: {
          if (this.wraps(t => t.type === types.underline, children => {
            this.push(new Parser(children, {
              type: nodes.underline,
            }).parse());
            this.pos += children.length + 2;
          })) break;

          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        // italics
        case types.italics: {
          if (this.wraps(t => t.type === types.italics && t.value === token.value, children => {
            this.push(new Parser(children, {
              type: nodes.italics,
            }).parse());
            this.pos += children.length + 2;
          })) break;

          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }

        // strikethrough
        case types.strikethrough: {
          if (this.wraps(t => t.type === types.strikethrough, children => {
            this.push(new Parser(children, {
              type: nodes.strikethrough,
            }).parse());
            this.pos += children.length + 2;
          })) break;
          
          this.push(new nodes.text(token.raw));
          this.pos++; break;
        }
        
        // whitespace
        case types.whitespace: {
          if (token.value < 2) {
            this.push(new nodes.whitespace(token.value));
            this.pos++; break;
          }
          this.paragraph(); break;
        }

        // text
        case types.text: {
          this.push(new nodes.text(token.value));
          this.pos++; break;
        }
      }
    }

    if (this.nodes.at(0) instanceof nodes.whitespace && this.nodes.length > 2) this.nodes.splice(0, 1);
    if (this.nodes.at(-1) instanceof nodes.whitespace && this.nodes.length > 2) this.nodes.splice(-1, 1);

    return this.type === 'inline'
      ? this.nodes
      : new this.type(this.nodes, this.tokens.front);
  }
}