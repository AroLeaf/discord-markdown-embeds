declare module 'discord-markdown-embeds';

export class Node {
  children: Node[];
  constructor(children: Node[]);
  render(options: renderOptions): string;
}

export class DocumentNode extends Node {
  render(options: renderOptions): embeds;
}

export interface token {
  type: string,
  raw: string,
  value?: string,
}

export interface paragraph {
  title?: string,
  paragraph: string,
  inline: boolean,
}

export type chunk = string | paragraph;

export interface embed {
  title?: string,
  description?: string,
  fields?: { name: string, value: string }[],
  image?: { url: string },
}

export interface embeds extends Array<embed> {
  messages(): message[];
}

export interface message {
  embeds: embed[];
}

export interface renderOptions {
  list: string,
  commands: object,
}

export class Lexer {
  input: string;
  pos: number;
  tokens: token[];
  isStart: boolean;

  constructor(markdown: string);
  match(regex: RegExp|string, cb: (match: string[]) => any): ReturnType<typeof cb> | boolean;
  push(token: token): undefined;
  parse(): token[];
}

export class Parser {
  pos: number;
  tokens: token[];
  type: Node|'inline';
  nodes: Node[];

  constructor(tokens: token[], { type, pos }?: { type?: Node|'inline', pos?: number });
  find(predicate: Function, cb: (position: number) => any): ReturnType<typeof cb>;
  wraps(predicate: Function, cb: (tokens: token[]) => any, matchEnd?: boolean): ReturnType<typeof cb> | boolean;
  push(node: Node): undefined;
  parse(): Node | Node[];
}

export class Renderer {
  document: DocumentNode;
  pos: number;
  chunks: chunk[][];
  embeds: embed[];

  constructor(document: DocumentNode);
  next(): Node;
  push(paragraph: paragraph): any;
  embed(data: object): embed;
  render(options: renderOptions): embeds;
}

export function template(md: string): DocumentNode;
export function parse(md: string, options: renderOptions): embeds;