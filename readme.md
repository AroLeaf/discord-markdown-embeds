# Discord Markdown Embeds
<!-- I can haz comment -->

This package allows you to create discord embeds from markdown.

## Install

```sh
npm i discord-markdown-embeds
```

## Usage

```js
import DME from 'discord-markdown-embeds';

const md = `
# Never gonna
- give you up
- let you down
- run around
- desert you
- make you cry
- say goodbye
- tell a lie
- hurt you
`;

// render directly (slow)
DME.parse(md, { ul: '-> ' });

// create template (still slow)
const template = DME.template(md);
// render template (fast)
template.render({ ul: '-> ' });
```

## Syntax


```md
---
content: This is yaml front matter, which is used to add things to the embeds and messages that don't fit well in the actual document, like embed color, webhook username and pfp, or message content.
author: The author and footer can be a string,
footer:
  text: or they can be an object.
  icon_url: https://leaf.moe/assets/sayuleaf.png
avatar_url: https://leaf.moe/assets/sayuleaf.png # can also be pfp or avatar
username: can also be name or nickname
color: # may also be a single value, multiple values repeat from the start if more embeds than colors are found
  - 0x442200 # this is a dark brown
  - 442200 # this is light green, because it thinks it's a decimal value instead of hexadecimal
  - '#442200' # this is dark brown again
---

# Embed Markdown
Titles and paragraphs get distributed over as little embeds as necessary.

##-in
Using `-` as title separator
##-line
makes it an inline field.

## Commands
Commands are written as follows: {command:arg1,arg2,arg3 can have spaces too}.
This will be executed through `options.commands.command('arg1', 'arg2', 'arg3 can have spaces too')`.
Commands may also be static values: {user}.
If `options.commands.user` is not a function it will be stringified and inserted directly.
Using a command in markdown when it's not defined in the options will cause an error.

## implemented:
- the above
- lists
- styling (*italics*, **bold**, __underline__ and ~~strikethrough~~)
- code blocks and inline code
- images anywhere within the document (won't render inline though)
- comments
- yaml front matter (for color, author, footer, timestamp etc)

## not going to implement:
- tables
- html syntax
- image links inside of regular links, styling, or lists
```

## Documentation

### `DME.render(md: string, options?: renderOptions): embeds`
parses and renders a markdown string into embeds\
`md`: your markdown\
`options` options for rendering embeds

### `DME.template(md: string): template`
parses markdown into a template\
`md`: your markdown

### `template`
a template to quickly render the same markdown multiple times with different command values
#### `template.render(options?: renderOptions): embeds`
renders the template\
`options` options for rendering embeds

### `embeds: object[]`
an array of discord embed objects
#### `embeds.messages(): object[]`
divides the embeds into message objects, based on discord's restrictions (max 6000 chars / 10 embeds)

### `renderOptions: object`
`commands`: an object of commands, commands can be functions or values with a `.toString` method\
`ul`: a string or function, overrides the unordered list item icon
`ol`: a string or function, overrides the ordered list item icon. If a string, the first occurrence of the character `n` is replaced with the item number.
`html`: a boolean, if true, render to html instead of back to markdown. This only applies to strings inside returned objects, the object structure doesn't change.
