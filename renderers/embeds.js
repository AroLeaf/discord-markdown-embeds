const SimpleMarkdown = require('@khanacademy/simple-markdown/dist/index.js');

const inlineRenderers = {
  html: require('./html.js'),
  markdown: require('./markdown.js'),
}

module.exports = {
  render(AST, options) {
    const parts = AST.flatMap(node => {
      switch(node.type) {
        case 'frontmatter': return this.frontmatter(node, options);
        case 'function': return this.function(node, options);
        case 'heading': return this.heading(node, options);
        case 'inlineHeading': return this.inlineHeading(node, options);
        case 'embedHeading': return this.embedHeading(node, options);
        case 'codeBlock': return this.codeBlock(node, options);
        case 'blockQuote': return this.blockQuote(node, options);
        case 'list': return this.list(node, options);
        case 'paragraph': return this.paragraph(node, options);
      }
    }).filter(i => i);

    let frontmatter = {};
    
    const fields = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      switch (part.type) {
        case 'frontmatter': {
          frontmatter = part.data;
          break;
        }
        
        case 'image': {
          fields.push(part);
          break;
        }
        
        case 'title': {
          fields.push({
            type: 'field',
            title: part,
            body: parts[i + 1]?.type === 'body' ? parts[++i] : undefined,
          });
          break;
        }
        
        case 'body': {
          fields.push({
            type: 'field',
            body: part,
          });
        }
      }
    }

    const embeds = [];
    const lengths = Object.assign([], { body: 0 });
    let embed, gapSize = 0;
   
    const getFieldSize = (field) => {
      const title = field.title?.markdown().length || 0;
      const body = field.body?.markdown().length || 0;
      return {
        title, body,
        total: title + body,
      }
    };
    
    const newEmbed = replaceWith => {
      if (embed) embeds.push(embed);
      embed = replaceWith;
      const getAuthor = author => typeof author === 'string' ? { name: author } : author;
      const author = embed && frontmatter.author && (
        (!embeds.length || frontmatter.author.all) && getAuthor(frontmatter.author)
        || Array.isArray(frontmatter.author) && getAuthor(frontmatter.author[embeds.length % frontmatter.author.length])
      );
      if (author) {
        embed.author = author;
        lengths[lengths.length - 1] += author.name.length || 0;
      }
    }
    
    for (const field of fields) {
      if (field.type === 'image') {
        if (!embed) newEmbed({});
        embed.image = { url: field.src };
        continue;
      }

      if (field.title?.titleType === 'embed') {
        const fieldSize = getFieldSize(field);
        lengths.push(fieldSize.title + (fieldSize.body || 3));
        lengths.body = field.body?.markdown().length || 0;
        gapSize = field.body?.gapSize || 0;
        newEmbed({
          title: field.title[options.as](),
          description: field.body?.[options.as](),
        });
        continue;
      }

      if (field.title) {
        const fieldSize = getFieldSize(field);
        if (!embed && !field.title.titleType) {
          lengths.push(fieldSize.title + (fieldSize.body || 3));
          lengths.body = fieldSize.body || 3;
          gapSize = field.body?.gapSize || 0;
          newEmbed({
            title: field.title[options.as](),
            description: field.body?.[options.as](),
          });
          continue;
        }
        if (!embed || embed.image || embed.fields?.length > 24 || fieldSize.body > 1024 || lengths.at(-1) + fieldSize.total > 6000) {
          if (field.title.titleType === 'inline') {
            lengths.push(fieldSize.title + (fieldSize.body || 3));
            lengths.body = fieldSize.body || 3;
            gapSize = field.body?.gapSize || 0;
            newEmbed({
              fields: [{
                name: field.title[options.as](),
                value: field.body?.[options.as]() || { html: '&nbsp;', markdown: '_ _' }[options.as],
                inline: field.title.titleType === 'inline',
              }],
            });
            continue;
          }
          lengths.push(fieldSize.total);
          lengths.body = fieldSize.body;
          gapSize = field.body?.gapSize || 0;
          newEmbed({
            title: field.title[options.as](),
            description: field.body?.[options.as](),
          });
          continue;
        }

        embed.fields ??= [];
        embed.fields.push({
          name: field.title[options.as](),
          value: field.body?.[options.as]() || { html: '&nbsp;', markdown: '_ _' }[options.as],
          inline: field.title.titleType === 'inline',
        });
        lengths[lengths.length - 1] += fieldSize.title + (fieldSize.body || 3);
        lengths.body = (fieldSize.body || 3);
        gapSize = field.body?.gapSize || 0;
        continue;
      }

      {
        const fieldSize = getFieldSize(field);
        if (embed && !embed.image && !embed.fields?.length && lengths.body + fieldSize.body + Math.min(gapSize, field.body.gapSize) <= 4096) {
          embed.description += ({ html: '<br>', markdown: '\n' }[options.as]).repeat(Math.min(gapSize, field.body.gapSize)) + field.body[options.as]();
          lengths[lengths.length - 1] += fieldSize.body + Math.min(gapSize, field.body.gapSize);
          lengths.body += fieldSize.body + Math.min(gapSize, field.body.gapSize);
          gapSize = field.body.gapSize;
          continue;
        }

        if (embed?.fields?.length && !embed.image && lengths.body + fieldSize.body + Math.min(gapSize, field.body.gapSize) <= 1024) {
          embed.fields.at(-1).value += ({ html: '<br>', markdown: '\n' }[options.as]).repeat(Math.min(gapSize, field.body.gapSize)) + field.body[options.as]();
          lengths[lengths.length - 1] += fieldSize.body + Math.min(gapSize, field.body.gapSize);
          lengths.body += fieldSize.body + Math.min(gapSize, field.body.gapSize);
          gapSize = field.body.gapSize;
          continue;
        }

        if (!embed || embed.image || fieldSize.body > 1024 || embed.fields?.length > 24 || lengths.at(-1) + 3 + fieldSize.body > 6000) {
          lengths.push(fieldSize.body);
          lengths.body = fieldSize.body;
          gapSize = field.body.gapSize;
          newEmbed({ description: field.body[options.as]() });
          continue;
        }
        
        embed.fields ??= [];
        embed.fields.push({
          name: { html: '&nbsp;', markdown: '_ _' }[options.as],
          value: field.body[options.as](),
        });

        lengths[lengths.length - 1] += 3 + fieldSize.body;
        lengths.body = fieldSize.body;
        gapSize = field.body.gapSize;
      }
    }

    newEmbed();

    if (frontmatter.color) {
      const colors = Array.isArray(frontmatter.color) ? frontmatter.color : [frontmatter.color];
      if (colors.length) for (let i = 0; i < embeds.length; i++) {
        const embed = embeds[i];
        const color = colors[i % colors.length];
        embed.color = typeof color === 'string' ? parseInt(/#?[\da-f]{6}/.exec(color)?.[1]) || 0 : color;
      }
    }

    if (frontmatter.footer) {
      const getFooter = footer => typeof footer === 'string' ? { text: footer } : footer;
      if (frontmatter.footer.all) for (const embed of embeds) embed.footer = frontmatter.footer;
      else if (Array.isArray(frontmatter.footer)) for (let i = 0; i < embeds.length; i++) embeds[i].footer = getFooter(frontmatter.footer[i % frontmatter.footer.length]);
      else embeds.at(-1).footer = getFooter(frontmatter.footer);
    }

    if (frontmatter.thumbnail) {
      const getThumbnail = thumbnail => typeof thumbnail === 'string' ? { url: thumbnail } : thumbnail;
      if (frontmatter.thumbnail.all) for (const embed of embeds) embed.thumbnail = frontmatter.thumbnail;
      else if (Array.isArray(frontmatter.thumbnail)) for (let i = 0; i < embeds.length; i++) embeds[i].thumbnail = getThumbnail(frontmatter.thumbnail[i % frontmatter.thumbnail.length]);
      else embeds[0].thumbnail = getThumbnail(frontmatter.thumbnail);
    }

    delete lengths.body;
    return Object.assign(embeds, {
      lengths,
      
      messages() {
        const chunks = [[]];
        let length = 0;
        for (let i = 0; i < this.length; i++) {
          if (length + lengths[i] > 6000) {
            chunks.push([]);
            length = 0;
          }
          chunks.at(-1).push(this[i]);
        }
        
        return chunks.map((embeds, i) => {
          const message = { embeds };
          const getText = content => content.text || content;
          const content = frontmatter.content && (
            (frontmatter.content.all || i === 0) && getText(frontmatter.content)
            || Array.isArray(frontmatter.content) && getText(frontmatter.content[i % frontmatter.content.length])
          );
          if (content) message.content = content;
          for (const prop of [
            'allowed_mentions',
            'ephemeral',
            'avatar_url',
            'username',
          ]) if (frontmatter[prop]) message[prop] = frontmatter[prop];
          return message;
        });
      },
    });
  },


  frontmatter(node, options) {
    return {
      type: 'frontmatter',
      data: node.content,
    }
  },

  function(node, options) {
    let output;
    try {
      output = node.func(options);
    } catch (error) {
      output = error.toString();
    }
    return typeof output === 'object' ? output : {
      type: 'body',
      gapSize: 2,
      html: () => `<p>${output}</p>`,
      markdown: () => `${output}`,
    }
  },

  heading(node, options) {
    return {
      type: 'title',
      titleType: undefined,
      html: () => inlineRenderers.html(node.content, options),
      markdown: () => inlineRenderers.markdown(node.content, options),
    }
  },

  inlineHeading(node, options) {
    return {
      type: 'title',
      titleType: 'inline',
      html: () => inlineRenderers.html(node.content, options),
      markdown: () => inlineRenderers.markdown(node.content, options),
    }
  },

  embedHeading(node, options) {
    return {
      type: 'title',
      titleType: 'embed',
      html: () => inlineRenderers.html(node.content, options),
      markdown: () => inlineRenderers.markdown(node.content, options),
    }
  },

  codeBlock(node, options) {
    return {
      type: 'body',
      gapSize: 1,
      html: () => `<pre class="language-${node.lang || 'plaintext'}"><code>${SimpleMarkdown.sanitizeText(node.content)}</code></pre>`,
      markdown() {
        const lang = node.lang || 'plaintext';
        const fence = '```';
        return `${fence}${lang}\n${node.content}\n${fence}`;
      },
    }
  },

  blockQuote(node, options) {
    return {
      type: 'body',
      gapSize: 2,
      html: () => inlineRenderers.html(node), options,
      markdown() {
        const md = inlineRenderers.markdown(node.content, options);
        return md.split('\n').map(line => `> ${line}`).join('\n');
      },
    }
  },

  list(node, options = {}) {
    const { ol = 'n. ', ul = '• ' } = options
    return {
      type: 'body',
      gapSize: 2,
      html() {
        const tag = node.ordered ? 'ol' : 'ul';
        return `<${tag}>${node.items.map(item => `<li>${inlineRenderers.html(item, options)}</li>`).join('')}</${tag}>`;
      },
      markdown() {
        return node.ordered
          ? node.items.map((item, i) => typeof ol === 'string' ? ol.replaceAll('n', i + 1) : ol(i + 1) + inlineRenderers.markdown(item, options)).join('\n')
          : node.items.map((item) => (typeof ul === 'string' ? ul : ul()) + inlineRenderers.markdown(item, options)).join('\n');
      },
    }
  },

  paragraph(node, options) {
    const parts = [];
    for (const item of node.content) {
      if (item.type === 'image') {
        parts.push(this.image(item, options));
        continue;
      }

      if (!parts.at(-1)?.items) parts.push({
        type: 'body',
        gapSize: 2,
        items: [],
        html() { return inlineRenderers.html(this.items, options) },
        markdown() { return this.items.map(item => inlineRenderers.markdown(item, options)).join('') },
      });

      parts.at(-1).items.push(item);
    }
    return parts;
  },

  image(node, options) {
    return {
      type: 'image',
      src: node.target,
      html: () => inlineRenderers.html(node, options),
    }
  },
}
