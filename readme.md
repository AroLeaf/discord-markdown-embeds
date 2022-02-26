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

// render directly
DME.parse(md, { list: '-> ' });

// create template
const template = DME.template(md);
// render template
template.render({ list: '-> ' });
```

## Syntax

```md
# Embed Markdown
the first field of every embed gets set as the title + description of that embed. This will probably change at some point.

##-in
using `-` as title separator
##-line
makes it an inline field

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

### `DME.parse(md, [options])`
parses and renders a markdown string into embeds\
`md`: a string containing markdown\
`options`: options for `template.render()`\
**returns:** `embeds`

### `DME.template(md)`
parses markdown into a template\
`md`: a string containing markdown\
**returns:** `template`

### `template.parse([options])`
renders the template\
`options.commands`: an object of commands, commands can be functions or values with a `.toString` method\
`options.list`: a string, overrides the list item icon\
**returns:** `embeds`

### `embeds`
an array of discord embed objects

### `embeds.messages()`
divides the embeds into message objects, based on discord's restrictions (max 6000 chars / 10 embeds)