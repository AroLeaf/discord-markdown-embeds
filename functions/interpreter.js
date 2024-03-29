const interpreter = {
  interpret(AST) {
    const expression = this.expression(AST.children[0]);
    return (options, defaults = require('./defaults.js')) => expression({ ...defaults, ...options });
  },

  expression(expr) {
    switch(expr.type) {
      case 'property': return this.property(expr);
      case 'call': return this.call(expr);
      case 'object': return this.object(expr);
      case 'array': return this.array(expr);
      case 'identifier': return this.identifier(expr);
      case 'string': return this.string(expr);
      case 'number': return this.number(expr);
      default: throw new Error(`${expr.type} not implemented`);
    }
  },

  property(node) {
    const object = node.children[0];
    const objectExpression = this.expression(object);
    return node.children.slice(1).reduce((a, v) => {
      if (v.type === 'identifier') return (options) => a(options)[v.value];
      const propertyExpression = this.expression(v);
      return (options) => a(options)[propertyExpression(options)];
    }, objectExpression);
  },

  call(node) {
    const funcName = node.children.shift().value;
    const expressions = node.children.map(child => this.expression(child));
    return (options) => options[funcName](options, ...expressions.map(expr => expr(options)));
  },

  object(node) {
    const expressions = node.children.map(child => this.expression(child));
    return (options) => {
      const obj = {};
      for (let i = 0; i < expressions.length; i += 2) {
        obj[node.children[i].value] = expressions[i+1](options)
      };
      return obj;
    }
  },

  array(node) {
    const expressions = node.children.map(child => this.expression(child));
    return (options) => expressions.map(expr => expr(options));
  },

  identifier(token) {
    return (options) => options[token.value];
  },

  string(token) {
    return () => token.value;
  },

  number(token) {
    return () => +token.value;
  },
}

module.exports = (AST) => interpreter.interpret(AST);