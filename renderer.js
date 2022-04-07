import nodes from './nodes.js';

export default class Renderer {
  constructor(document) {
    this.document = document;
    this.pos = 0;
    this.chunks = [[]];
    this.embeds = [];
  }



  next() {
    return this.document.children[this.pos + 1];
  }



  push(node, options = {}) {
    if (node.paragraph.length > 4096) throw new Error(`Paragrahs may only have 4096 characters, the following has ${node.paragraph.length} characters: ${node.paragraph}`)
    if (node.title?.length > 256) throw new Error(`Titles may only have 256 characters, the following has ${node.title.length} characters: ${node.title}`);
    
    if (!node.title) {
      const limit = Array.isArray(this.chunks.at(-1)) ? (this.chunks.at(-1).length == 1 ? 4096 : 1024) - (this.chunks.at(-1).at(-1)?.paragraph.length || 0) : 0;
      if (node.paragraph.length <= limit && this.chunks.at(-1).at(-1)) {
        return options.html
          ? this.chunks.at(-1).at(-1).paragraph = this.chunks.at(-1).at(-1).paragraph.slice(0, -4) + ('\n\n' + node.paragraph.slice(3))
          : this.chunks.at(-1).at(-1).paragraph += ('\n\n' + node.paragraph);
      }
      node.title = '_ _';
    }
    
    const length = node.title.length + node.paragraph.length;
    const limit = Array.isArray(this.chunks.at(-1)) ? Math.min(6000 - this.chunks.at(-1).reduce((a, v) => a + (v.title.length) + v.paragraph.length, 0), 1024 + node.title.length) : 0;

    return (length <= limit && this.chunks.at(-1).length <= 25) 
      ? this.chunks.at(-1).push(node)
      : this.chunks.push([node]);
  }



  embed(data) {
    const embed = {};
    for (const key in data) {
      if (data[key] && data[key].length !== 0) embed[key] = data[key];
    }
    this.embeds.push(embed);
  }



  render(options) {
    while(this.document.children[this.pos]) {
      const node = this.document.children[this.pos];
      
      switch (node.constructor) {
        case nodes.title: {
          const paragraph = this.next()?.constructor === nodes.paragraph && this.next();
          this.push({
            inline: node.type === '-',
            title: node.render(options),
            paragraph: paragraph.render?.(options) || '_ _',
          }, options);
          this.pos += paragraph ? 2 : 1; break;
        }

        case nodes.paragraph: {
          this.push({
            inline: false,
            paragraph: node.render(options),
          }, options);
          this.pos++; break;
        }

        case nodes.image: {
          this.chunks.push(node.render(options));
          this.pos++; break;
        }

        default:
          this.pos++;
      }
    }

    this.pos = 0;
    while(this.chunks[this.pos]) {
      const chunk = this.chunks[this.pos];
      
      if (typeof chunk === 'string') {
        this.embed({ image: { url: chunk } });
        this.pos++; continue;
      }

      if (!chunk.length) { this.pos++; continue; }

      const { title, paragraph: description } = chunk.shift() || {};
      const image = typeof this.chunks[this.pos + 1] === 'string' && this.chunks[this.pos + 1];
      const fields = chunk.length ? chunk.map(p => ({
        name: p.title,
        value: p.paragraph,
        inline: p.inline
      })) : null;

      this.embed({
        title: title !== '_ _' && title,
        description: description !== '_ _' && description,
        fields,
        image: image && { url: image },
      });
      this.pos += image ? 2 : 1;
    }

    if (this.document.front?.color) {
      const colors = (Array.isArray(this.document.front?.color) ? this.document.front?.color : [this.document.front?.color])
        .map(color => typeof color === 'string'
          ? parseInt(/^#?([0-9a-fA-F]{6})$/.exec(color)?.[1], 16)
          : color);
      this.embeds.forEach((em, i) => colors[i % colors.length] && (em.color = colors[i % colors.length]));
    }

    if (typeof this.document.front?.author === 'string' || this.document.front?.author?.name) {
      const author = typeof this.document.front?.author === 'string'
        ? { name: this.document.front.author }
        : this.document.front.author;
      if (author.all) this.embeds.forEach(em => em.author = author);
      else if (this.embeds.length) this.embeds[0].author = author;
      else this.embeds.push({ author });
    }

    if (typeof this.document.front?.footer === 'string' || this.document.front?.footer?.text) {
      const footer = typeof this.document.front.footer === 'string'
        ? { text: this.document.front.footer }
        : this.document.front.footer;
      if (footer.all) this.embeds.forEach(em => em.footer = footer);
      else if (this.embeds.length) this.embeds.at(-1).footer = footer;
      else this.embeds.push({ footer });
    }

    if (typeof this.document.front?.thumbnail === 'string' || this.document.front?.thumbnail?.url) {
      const thumbnail = typeof this.document.front.thumbnail === 'string'
        ? { url: this.document.front.thumbnail }
        : this.document.front.thumbnail;
      if (thumbnail.all) this.embeds.forEach(em => em.thumbnail = thumbnail);
      else if (this.embeds.length) this.embeds[0].thumbnail = thumbnail;
      else this.embeds.push({ thumbnail });
    }

    this.embeds.messages = function () {
      const chunks = [[]];
      const length = a => a.flatMap(e => [e.title||'', e.description||''].concat(...e.fields?.map(f => [f.name, f.value])||[])).reduce((a,v) => a + v.length, 0);
      for (const embed of this) {
        length(chunks.at(-1).concat(embed)) <= 6000 && chunks.at(-1).length < 10
          ? chunks.at(-1).push(embed)
          : chunks.push([embed]);
      }
      const messages =  chunks.map(c => ({ embeds: c }));
      if (this.front) {
        messages.front = this.front;

        if (typeof messages.front.content === 'string' || messages.front.content?.text) {
          const content = typeof messages.front.content === 'string'
            ? { text: messages.front.content }
            : messages.front.content;
          if (content.all) messages.forEach(msg => msg.content = content.text);
          else if (messages.length) messages[0].content = content.text;
          else messages.push({ content: content.text });
        }

        ['avatar_url', 'avatar', 'pfp'].some(prop => prop in messages.front && messages.forEach(msg => msg.avatar_url = messages.front[prop]));
        ['username', 'nickname', 'name'].some(prop => prop in messages.front && messages.forEach(msg => msg.username = messages.front[prop]));
      }
      return messages;
    }

    this.embeds.front = this.document.front;
    return this.embeds;
  }
}