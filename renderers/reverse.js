const yaml = require('yaml');

function reverseEmbeds(embeds, extraFrontData = {}) {
  const frontmatter = {
    ...extraFrontData,
    author: reverseAuthors(embeds),
    thumbnail: reverseThumbnails(embeds),
    footer: reverseFooters(embeds),
  }

  const body = embeds.flatMap(embed => [
    embed.title && `#!${embed.title}`,
    embed.description,
    embed.fields && embed.fields.flatMap(field => [
      field.name && (field.name === '_ _' ? '' : `#${field.inline ? '-' : ' '}${field.name}`),
      field.value && (field.value === '_ _' ? '' : field.value),
    ]).filter(part => part).join('\n\n'),
    embed.image && `![image](${embed.image.url})`,
  ].filter(part => part).join('\n\n'));

  return [
    frontmatter && `---\n${stringifyYAML(frontmatter)}---`,
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
  ].every(k => first.author[k] === embed.author?.[k]))) return { ...first.author, all: true };
  return embeds.map(embed => embed.author);
}

function reverseThumbnails(embeds) {
  if (embeds.every(embed => !embed.thumbnail)) return;
  const first = embeds.shift();
  if (embeds.every(embed => !embed.thumbnail)) return first.thumbnail;
  if (embeds.every(embed => embed.thumbnail.url === first.thumbnail.url)) return { ...first.thumbnail, all: true };
  return [first].concat(embeds).map(embed => embed.thumbnail);
}

function reverseFooters(embeds) {
  if (embeds.every(embed => !embed.footer)) return;
  const last = embeds.pop();
  if (embeds.every(embed => !embed.footer)) return last.footer;
  if (embeds.every(embed => [
    'name',
    'icon_url',
  ].every(k => last.footer[k] === embed.footer?.[k]))) return { ...last.footer, all: true };
  return embeds.map(embed => embed.footer).concat(last);
}

function stringifyYAML(object) {
  const kvPairs = Object.entries(object).filter(([_,v])=>v);
  if (!kvPairs.length) return '';
  return yaml.stringify(Object.fromEntries(kvPairs));
}

module.exports = {
  reverseEmbeds, reverseMessage,
}