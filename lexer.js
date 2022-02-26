import XRegExp from 'xregexp';
import types from './tokens.js';

export default class Lexer {
  constructor(input) {
    this.input = input;
    this.pos = input.search(XRegExp(/\S/));
    this.tokens = [];
    this.isStart = true;
  }

  match(regex, cb = () => true) {
    const match = XRegExp.exec(this.input.slice(this.pos), XRegExp(regex));
    return match && (cb(match) ?? true);
  }

  push(token) {
    return this.tokens.push(token);
  }

  parse() {
    while (this.input[this.pos]) {
      (() => {
        // escape
        if (this.match(/^\\(.)/s, m => {
          this.push({
            type: types.text,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += 2;
        })) return;
        
        // command
        if (this.match(/^{(.+?)}/, m => {
          this.push({
            type: types.command,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // unordered list
        if (this.isStart && this.match(/^([-*+]) /, m => {
          this.push({
            type: types.list.unordered,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // ordered list
        if (this.isStart && this.match(/^(\d+)\. /, m => {
          this.push({ 
            type: types.list.ordered,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // title
        if (this.isStart && this.match(/^#{1,6}([- ])/, m => {
          this.push({
            type: types.title,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // link start
        if (this.match(/^!?\[/, m => {
          this.push({
            type: types.link.start,
            raw: m[0],
            value: m[0].length - 1,
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // link middle
        if (this.match(/^\]\(/, m => {
          this.push({
            type: types.link.middle,
            raw: m[0],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // link end
        if (this.match(/^\)/, m => {
          this.push({
            type: types.link.end,
            raw: m[0],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // code block
        if (this.match(/^```(.+?)```/s, m => {
          this.push({
            type: types.code.block,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;
        
        // inline code
        if (this.match(/^`(.+?)`/, m => {
          this.push({
            type: types.code.inline,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // bold
        if (this.match(/^\*\*/, m => {
          this.push({
            type: types.bold,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // underline
        if (this.match(/^__/, m => {
          this.push({
            type: types.underline,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // italics
        if (this.match(/^[_*]/, m => {
          this.push({
            type: types.italics,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos++;
        })) return;

        // strikethrough
        if (this.match(/^~~/, m => {
          this.push({
            type: types.strikethrough,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // indent
        // if (this.isStart && this.match(/^[^\S\r\n]+/, m => this.pos += m[0].length)) return;

        // whitespace
        if (this.match(/^\s+/, m => {
          const count = XRegExp.match(m[0], /\n/g).length;
          this.push({
            type: types.whitespace,
            raw: m[0],
            value: count,
          });
          this.isStart = !!count || this.isStart;
          this.pos += m[0].length;
        })) return;
        
        // text: whole words to improve speed
        if (this.match(/^[a-zA-Z0-9]+/, m => {
          this.push({
            type: types.text,
            raw: m[0],
            value: m[0],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;
        
        // text: any other single character
        if (this.match(/^./, m => {
          this.push({
            type: types.text,
            raw: m[0],
            value: m[0],
          });
          this.isStart = false;
          this.pos++;
        })) return;
      })();
    }
    return this.tokens;
  }
}