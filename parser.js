const SimpleMarkdown = require('@khanacademy/simple-markdown/dist/index.js');
const yaml = require('yaml');
const functions = require('./functions/index.js');

const rules = { ...SimpleMarkdown.defaultRules };

for (const key of [
  'nptable',
  'hr',
  'table',
  'tableSeparator',
  'mailto',
]) delete rules[key];


rules.comment = {
  order: -2,
  
  match(source) {
    return /^<!--.+?-->/s.exec(source);
  },
  
  parse() {
    return { content: '' };
  },
}


rules.frontmatter = {
  order: -1,
  
  match(source, state) {
    return state.prevCapture ? undefined : /^\s*---\n(.+?)\n\s*---\s*/s.exec(source);
  },

  parse(capture) {
    return { content: yaml.parse(capture[1]) }
  },
}


rules.mention = {
  order: rules.inlineCode.order + 0.5,
  
  match(source) {
    return /^<(@&?|#|\/|[at]?:)((?<=[&#])\d+|(?<=@)!?\d+|(?<=t:)\d+(?::[tTdDfFR])?|(?<=[<a]:)\w+:\d+|(?<=\/)[a-z0-9_-]+(?: [a-z0-9_-]+){0,2}:\d+)>/.exec(source);
  },

  parse(capture) {
    const [, type, rest] = capture;
    switch (type) {
      case '@': return {
        type: 'mention',
        mentionType: 'user',
        id: rest[0] === '!' ? rest.slice(1) : rest,
        content: '@user',
      }
      
      case '@&': return {
        type: 'mention',
        mentionType: 'role',
        id: rest,
        content: '@role',
      }
      
      case '#': return {
        type: 'mention',
        mentionType: 'channel',
        id: rest,
        content: '#channel',
      }
      
      case '/': {
        const [name, id] = rest.split(':');
        const parts = name.split(' ');
        return {
          type: 'mention',
          mentionType: 'command',
          command: parts[0],
          group: parts[3] && parts[2],
          subcommand: parts[3] || parts[2],
          content: name,
          id,
        }
      }
      
      case 'a:':
      case ':': {
        const [name, id] = rest.split(':');
        const animated = type[0] === 'a';
        return {
          type: 'mention',
          mentionType: 'emoji',
          name, id, animated,
        }
      }
      
      case 't:': {
        const [timestamp, format = 'f'] = rest.split(':');
        return {
          type: 'mention',
          mentionType: 'timestamp',
          timestamp, format,
        }
      }
    }
  },

  html(node) {
    switch (node.mentionType) {
      case 'user':
      case 'role':
      case 'channel': 
      case 'command': return `<span class="mention">${node.content}</span>`;
      case 'emoji': return `<img class="emoji" src="https://cdn.discordapp.com/emojis/${node.id}.${node.animated ? 'gif' : 'png'}">`;
      case 'timestamp': `<time data-time="${node.timestamp}" data-format="${node.format}">[Loading]</time>`;
    }
  }
}


rules.function = {
  order: rules.heading.order - 0.5,

  match(source) {
    const tokens = functions.tokenize(source);
    return tokens && Object.assign([source.slice(0, source.length - tokens.at(-1).value.length)], { tokens });
  },

  parse(capture) {
    const { tokens } = capture;
    try {
      const func = functions.parse(tokens);
      return { func };
    } catch (error) {
      return { func: () => error.toString() }
    }
  },

  html(node, state) {
    return node.func(state.options);
  },
}


rules.blockQuote = {
  ...rules.blockQuote,
  match: SimpleMarkdown.blockRegex(/^( *>[^\n]+(\n[^\n]+)*\n*)\n{2,}/),
  parse(capture, parse, state) {
    var content = capture[1].replace(/^ *> ?/gm, "");
    return {
      content: SimpleMarkdown.parseInline(parse, content, state),
    }
  }
}


rules.list = {
  ...rules.list,
  match: SimpleMarkdown.blockRegex(/^ *([*+-]|\d+\.) ((?:(?:\n(?! *(?:[*+-]|\d+\.)))?(?:[^\n]|$))*(?:\n *(?:\1|\d+\.) (?:(?:\n(?! *([*+-]|\d+\.)))?(?:[^\n]|$))*)*) *(?:\n *)*\n/),
  parse(capture, parse, state) {
    const ordered = capture[1].endsWith('.');
    const splitter = RegExp(`\\n *${ordered ? '\\d+\\.' : '\\' + capture[1]} `);
    const items = capture[2].split(splitter).map(part => SimpleMarkdown.parseInline(parse, part, state));
    return { items, ordered };
  },
}


rules.codeBlock = {
  ...rules.codeBlock,
  match: () => false,
}


rules.fence = {
  ...rules.fence,
  match: SimpleMarkdown.blockRegex(/^ *(`{3,}) *(?:(\S+) *)?\n(.+?)\n?\1 *(?:\n *)*\n/s,),
}


rules.heading = {
  ...rules.heading,
  match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) ((?:[^\n\\]|\\.)+?)#* *(?:\n *)*\n/s),
}


rules.inlineHeading = {
  ...rules.heading,
  match: SimpleMarkdown.blockRegex(/^ *(#{1,6})-((?:[^\n\\]|\\.)+?)#* *(?:\n *)*\n/s),
}


rules.embedHeading = {
  ...rules.heading,
  match: SimpleMarkdown.blockRegex(/^ *(#{1,6})!((?:[^\n\\]|\\.)+?)#* *(?:\n *)*\n/s),
}


rules.image = {
  ...rules.image,
  html(node, output, state) {
    return SimpleMarkdown.htmlTag('a', output(node.alt, state), {
      href: SimpleMarkdown.sanitizeUrl(node.target),
      title: node.title,
    });
  },
}


rules.br = {
  ...rules.br,
  match: SimpleMarkdown.anyScopeRegex(/^(?: {2,}|\\)\n/),
}


module.exports = {
  parse: SimpleMarkdown.parserFor(rules),
  rules,
};