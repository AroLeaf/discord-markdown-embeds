# Discord Markdown Embeds

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
DME.parse(md, { list: '-> ' });

// create template
const template = DME.template(md);
// render template (fast)
template.render({ list: '-> ' });
```

## Syntax

```md
# Embed Markdown
the first field of every embed gets set as the title + description of that embed.
This will probably change at some point.

##-in
using `-` as title separator
##-line
makes it an inline field

## Commands
commands are written as follows: {command:arg1,arg2,arg3 can have spaces too}
this will be executed through `options.commands.command('arg1', 'arg2', 'arg3 can have spaces too')`
commands may also be static values: {user}
if `options.commands.user` is not a function it will be stringified and inserted directly
using a command in markdown when it's not defined in the options will cause an error

## implemented:
- the above
- lists
- styling (*italics*, **bold**, __underline__ and ~~strikethrough~~)
- code blocks and inline code
- images anywhere within the document (won't render inline though)

## planned:
- yaml front matter (for color, author, footer, timestamp etc)
- comments

## not planned:
- tables
- html syntax
- image links inside of regular links, styling, or lists
```

## Documentation

### `DME.parse(md: string, options?: object): embeds`
parses and renders a markdown string into embeds\
`md`: your markdown markdown\
`options.commands`: an object of commands, commands can be functions or values with a `.toString` method\
`options.list`: a string, overrides the list item icon

### `DME.template(md: string): template`
parses markdown into a template\
`md`: your markdown

### `template`
a template to quickly render the same markdown multiple times with different commands
#### `template.render(options?: object): embeds`
renders the template\
`options.commands`: an object of commands, commands can be functions or values with a `.toString` method\
`options.list`: a string, overrides the list item icon

### `embeds: object[]`
an array of discord embed objects\
#### `embeds.messages(): object[]`
divides the embeds into message objects, based on discord's restrictions (max 6000 chars / 10 embeds)