const yaml = require('yaml');

function reverseEmbeds(embeds, extraFrontData = {}) {
  const frontmatter = {
    ...extraFrontData,
    author: reverseAuthors(embeds),
    thumbnail: reverseThumbnails(embeds),
    footer: reverseFooters(embeds),
  }

  const body = embeds.flatMap(embed => [
    embed.title && `#!${embed.url ? `[${embed.title.replaceAll('\n', '\\\n')}](${embed.url})` : embed.title.replaceAll('\n', '\\\n')}`,
    embed.description?.replaceAll('\n', '  \n'),
    embed.fields && embed.fields.flatMap(field => [
      field.name && (field.name === '_ _' ? '' : `#${field.inline ? '-' : ' '}${field.name.replaceAll('\n', '\\\n')}`),
      field.value && (field.value === '_ _' ? '' : field.value.replaceAll('\n', '  \n')),
    ]).filter(part => part).join('\n\n'),
    embed.image && `![image](${embed.image.url})`,
  ].filter(part => part).join('\n\n'));

  return [
    stringifyFrontmatter(frontmatter),
    body,
  ].filter(part => part).join('\n\n');
}

function reverseMessage(message) {
  const messageData = {
    content: message.content,
    username: message.username,
    avatar_url: message.avatar_url,
    allowed_mentions: message.allowed_mentions,
    ephemeral: message.ephemeral,
  }
  return reverseEmbeds(message.embeds, messageData);
}

function reverseAuthors(embeds) {
  if (embeds.every(embed => !embed.author)) return;
  const first = embeds.shift();
  if (embeds.every(embed => !embed.author)) return first.author;
  if (embeds.every(embed => [
    'name',
    'icon_url',
    'url'
  ].every(k => first.author?.[k] === embed.author?.[k]))) return { ...first.author, all: true };
  return embeds.map(embed => embed.author);
}

function reverseThumbnails(embeds) {
  if (embeds.every(embed => !embed.thumbnail)) return;
  const first = embeds.shift();
  if (embeds.every(embed => !embed.thumbnail)) return first.thumbnail;
  if (embeds.every(embed => embed.thumbnail?.url === first.thumbnail?.url)) return { ...first.thumbnail, all: true };
  return [first].concat(embeds).map(embed => embed.thumbnail);
}

function reverseFooters(embeds) {
  if (embeds.every(embed => !embed.footer)) return;
  const last = embeds.pop();
  if (embeds.every(embed => !embed.footer)) return last.footer;
  if (embeds.every(embed => [
    'name',
    'icon_url',
  ].every(k => last.footer?.[k] === embed.footer?.[k]))) return { ...last.footer, all: true };
  return embeds.map(embed => embed.footer).concat(last);
}

function stringifyFrontmatter(object) {
  const kvPairs = Object.entries(object).filter(([_,v])=>v);
  if (!kvPairs.length) return '';
  return `---\n${yaml.stringify(Object.fromEntries(kvPairs))}---`;
}

module.exports = {
  reverseEmbeds, reverseMessage,
}