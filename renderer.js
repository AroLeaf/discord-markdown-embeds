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



  push(node) {
    if (node.paragraph.length > 4096) throw new Error(`Paragrahs may only have 4096 characters, the following has ${node.paragraph.length} characters: ${node.paragraph}`)
    if (node.title?.length > 256) throw new Error(`Titles may only have 256 characters, the following has ${node.title.length} characters: ${node.title}`);
    
    if (!node.title) {
      const limit = (this.chunks.at(-1).length == 1 ? 4096 : 1024) - (this.chunks.at(-1).at(-1)?.paragraph.length || 0);
      if (node.paragraph.length <= limit && this.chunks.at(-1).at(-1)) {
        return this.chunks.at(-1).at(-1).paragraph += ('\n\n' + node.paragraph);
      }
      node.title = '_ _';
    }
    
    const length = (node.title?.length || 0) + node.paragraph.length;
    const limit = Math.min(6000 - this.chunks.at(-1).reduce((a, v) => a + (v.title.length) + v.paragraph.length, 0), 1024);
    
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
          });
          this.pos += paragraph ? 2 : 1; break;
        }

        case nodes.paragraph: {
          this.push({
            inline: false,
            paragraph: node.render(options),
          });
          this.pos++; break;
        }

        case nodes.image: {
          this.chunks.push(node.render(options), []);
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

      const { title, paragraph: description } = chunk.shift();
      const image = typeof this.chunks[this.pos + 1] === 'string' && this.chunks[this.pos + 1];
      const fields = chunk.length ? chunk.map(p => ({
        name: p.title,
        value: p.paragraph,
        inline: p.inline
      })) : null;

      this.embed({
        title: title !== '_ _' && title,
        description, fields,
        image: image && { url: image },
      });
      this.pos += image ? 2 : 1;
    }

    this.embeds.messages = function () {
      const chunks = [[]];
      const length = a => a.flatMap(e => [e.title||'', e.description||''].concat(...e.fields?.map(f => [f.name, f.value])||[])).reduce((a,v) => a + v.length, 0);
      for (const embed of this) {
        length(chunks.at(-1).concat(embed)) > 6000
          ? chunks.push([embed])
          : chunks.at(-1).push(embed);
      }
      return chunks.map(c => ({ embeds: c }));
    }

    return this.embeds;
  }
}