import XRegExp from 'xregexp';
import types from './tokens.js';

const regex = {
  escape:         XRegExp(/^\\(.)/s),
  command:        XRegExp(/^{(.+?)}/),
  ul:             XRegExp(/^([-*+]) /),
  ol:             XRegExp(/^(\d+)\. /),
  title:          XRegExp(/^#{1,6}([- ])/),
  linkStart:      XRegExp(/^!?\[/),
  linkMiddle:     XRegExp(/^\]\(/),
  linkEnd:        XRegExp(/^\)/),
  codeBlock:      XRegExp(/^```(.+?)```/s),
  inlineCode:     XRegExp(/^`(.+?)`/),
  bold:           XRegExp(/^\*\*/),
  underline:      XRegExp(/^__/),
  italics:        XRegExp(/^[_*]/),
  strikethrough:  XRegExp(/^~~/),
  whitespace:     XRegExp(/^\s+/),
  comment:        XRegExp(/^<!--.+?-->/s),
  word:           XRegExp(/^[a-zA-Z]+/),
  char:           XRegExp(/^./),
}

export default class Lexer {
  constructor(input) {
    this.input = input;
    this.pos = input.search(XRegExp(/\S/));
    this.tokens = [];
    this.isStart = true;
    this.lastMatchPos = 0;
  }

  match(regex, cb = () => true) {
    if (this._pos !== this.pos) {
      this._input = this.input.slice(this.pos);
      this._pos = this.pos;
    }
    const match = XRegExp.exec(this._input, regex);
    return match && (cb(match) ?? true);
  }

  push(token) {
    return this.tokens.push(token);
  }

  parse() {
    while (this.input[this.pos]) {
      (() => {
        // escape /^\\(.)/s
        if (this.match(regex.escape, m => {
          this.push({
            type: types.text,
            raw: m[0],
            value: m[1],
          });
          this.isStart = m[1] == '\n';
          this.pos += 2;
        })) return;
        
        // command /^{(.+?)}/
        if (this.match(regex.command, m => {
          this.push({
            type: types.command,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // unordered list /^([-*+]) /
        if (this.isStart && this.match(regex.ul, m => {
          this.push({
            type: types.list.unordered,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // ordered list /^(\d+)\. /
        if (this.isStart && this.match(regex.ol, m => {
          this.push({ 
            type: types.list.ordered,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // title /^#{1,6}([- ])/
        if (this.isStart && this.match(regex.title, m => {
          this.push({
            type: types.title,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // link start /^!?\[/
        if (this.match(regex.linkStart, m => {
          this.push({
            type: types.link.start,
            raw: m[0],
            value: m[0].length - 1,
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // link middle /^\]\(/
        if (this.match(regex.linkMiddle, m => {
          this.push({
            type: types.link.middle,
            raw: m[0],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // link end /^\)/
        if (this.match(regex.linkEnd, m => {
          this.push({
            type: types.link.end,
            raw: m[0],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // code block /^```(.+?)```/s
        if (this.match(regex.codeBlock, m => {
          this.push({
            type: types.code.block,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;
        
        // inline code /^`(.+?)`/
        if (this.match(regex.inlineCode, m => {
          this.push({
            type: types.code.inline,
            raw: m[0],
            value: m[1],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;

        // bold /^\*\*/
        if (this.match(regex.bold, m => {
          this.push({
            type: types.bold,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // underline /^__/
        if (this.match(regex.underline, m => {
          this.push({
            type: types.underline,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // italics /^[_*]/
        if (this.match(regex.italics, m => {
          this.push({
            type: types.italics,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos++;
        })) return;

        // strikethrough /^~~/
        if (this.match(regex.strikethrough, m => {
          this.push({
            type: types.strikethrough,
            raw: m[0],
            value: m[0], 
          });
          this.isStart = false;
          this.pos += 2;
        })) return;

        // whitespace /^\s+/
        if (this.match(regex.whitespace, m => {
          const count = XRegExp.match(m[0], /\n/g).length;
          this.push({
            type: types.whitespace,
            raw: m[0],
            value: count,
          });
          this.isStart = !!count || this.isStart;
          this.pos += m[0].length;
        })) return;

        // comment /^<!--.+?-->/s
        if (this.match(regex.comment, m => {
          this.isStart = false;
          this.pos += m[0].length;
        })) return;
        
        // text: whole words to improve speed /^[a-zA-Z]+/
        if (this.match(regex.word, m => {
          this.push({
            type: types.text,
            raw: m[0],
            value: m[0],
          });
          this.isStart = false;
          this.pos += m[0].length;
        })) return;
        
        // text: any other single character /^./
        if (this.match(regex.char, m => {
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