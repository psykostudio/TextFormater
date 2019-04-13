export enum defaultEntityMap {
  quot = "\u0022",
  amp = "\u0026",
  lt = "\u003C",
  gt = "\u003E",
  nbsp = "\u00A0"
}

export enum tokenTypes {
  OPENING_TAG_END = "opening-tag-end",
  OPENING_TAG = "opening-tag",
  CLOSING_TAG = "closing-tag",
  ATTRIBUTE = "attribute",
  COMMENT = "comment",
  START = "start",
  CLOSE = "close",
  OPEN = "open",
  TEXT = "text",
  DONE = "done"
}

const states = {
  inTag: Symbol(),
  inComment: Symbol(),
  inText: Symbol(),
  inScript: Symbol()
};

export interface Entity {
  [name: string]: string;
}

export interface TokenizerOptions {
  entities?: Entity;
}

export interface Token {
  type: tokenTypes;
  name: string;
  text?: string;
  value?: string;
  token?: string;
}

export class Tokenizer {
  private entityMap: Entity;

  constructor(opts: TokenizerOptions = {}) {
    this.entityMap = Object.assign({}, defaultEntityMap, opts.entities);
    Object.freeze(this);
  }

  entities(map) {
    Object.assign(this.entityMap, map);
  }

  public *tokenize(html): IterableIterator<Token> {
    let currentText;
    for (const tkn of this._tokenize(html)) {
      if (tkn.type === tokenTypes.TEXT) {
        const text = tkn.text;
        if (currentText === undefined) {
          currentText = text;
        } else {
          currentText += text;
        }
      } else {
        if (currentText) {
          const deentText = Tokenizer.deentityify(currentText, this.entityMap);
          yield { type: tokenTypes.TEXT, text: deentText, name: "" };
          currentText = undefined;
        }
        yield tkn;
      }
    }
  }

  private *_tokenize(html): IterableIterator<Token> {
    yield { type: tokenTypes.START, name : "" };
    let pos = 0;
    let state = states.inText;
    let currentTag;
    let next;
    while (pos < html.length) {
      if (state === states.inText) {
        const isBracket = html.charAt(pos) === "<"; // cheap pre-emptive check
        if (isBracket && (next = Chunk.getOpeningTag(html, pos))) {
          pos += next.length;
          currentTag = next.match[2];
          yield { type: tokenTypes.OPENING_TAG, name: currentTag };
          state = states.inTag;
        } else if (isBracket && (next = Chunk.getClosingTag(html, pos))) {
          pos += next.length;
          yield { type: tokenTypes.CLOSING_TAG, name: next.match[2] };
        } else if ((next = Chunk.getText(html, pos))) {
          pos += next.length;
          yield { type: tokenTypes.TEXT, name: currentTag, text: next.match[1] };
        } else {
          const text = html.substring(pos, pos + 1);
          pos += 1;
          yield { type: tokenTypes.TEXT, name: currentTag, text };
        }
      } else if (state === states.inTag) {
        if ((next = Chunk.getAttributeName(html, pos))) {
          pos += next.length;
          const name = next.match[2];
          const hasVal = next.match[4];
          if (hasVal) {
            const read = Tokenizer.readAttribute(html, pos);
            pos += read.length;
            yield {
              type: tokenTypes.ATTRIBUTE,
              name,
              value: Tokenizer.deentityify(read.value, this.entityMap)
            };
          } else {
            yield { type: tokenTypes.ATTRIBUTE, name, value: "" };
          }
        } else if ((next = Chunk.getTagEnd(html, pos))) {
          pos += next.length;
          const token = next.match[2];
          yield { type: tokenTypes.OPENING_TAG_END, name: currentTag, token };
          state = currentTag === "script" ? states.inScript : states.inText;
        } else {
          state = states.inText;
        }
      } else {
        break;
      }
    }
    yield { type: tokenTypes.DONE, name: "" };
  }
  private static handlerPattern = /&(#?)([a-z0-9]+);/gi;
  private static handlers = new WeakMap();

  private static getHandler(map) {
    let handler = this.handlers.get(map);
    if (!handler) {
      const callback = function(ent, isNum, content) {
        if (isNum) {
          const num =
            content.charAt(0) === "x"
              ? parseInt("0" + content, 16)
              : parseInt(content, 10);
          return String.fromCharCode(num);
        } else {
          return map[content] || ent;
        }
      };
      handler = text => {
        return text.indexOf("&") > -1 // attempt short circuit
          ? text.replace(this.handlerPattern, callback)
          : text;
      };
      this.handlers.set(map, handler);
    }
    return handler;
  }

  private static deentityify(text, map) {
    const handler = this.getHandler(map);
    return handler(text);
  }

  private static readAttributePattern = /(\s*([^>\s]*))/g;
  private static quotes = new Set("\"'");

  private static readAttribute(str, pos): { length: number; value: string } {
    const quote = str.charAt(pos);
    const pos1 = pos + 1;
    if (Tokenizer.quotes.has(quote)) {
      const nextQuote = str.indexOf(quote, pos1);
      if (nextQuote === -1) {
        return { length: str.length - pos, value: str.substring(pos1) };
      } else {
        return {
          length: nextQuote - pos + 1,
          value: str.substring(pos1, nextQuote)
        };
      }
    } else {
      Tokenizer.readAttributePattern.lastIndex = pos;
      const match = Tokenizer.readAttributePattern.exec(str);
      return { length: match[1].length, value: match[2] };
    }
  }
}

export class Chunk {
  public static getOpeningTag(str: string, pos: number) {
    return this.findPattern(str, pos, /(<(([a-z0-9-]+:)?[a-z0-9-]+))/gi);
  }

  public static getText(str: string, pos: number) {
    return this.findPattern(str, pos, /([^<]+)/g);
  }

  public static getClosingTag(str: string, pos: number) {
    return this.findPattern(str, pos, /(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/gi);
  }

  public static getTagEnd(str: string, pos: number) {
    return this.findPattern(str, pos, /(\s*(\/?>))/g);
  }

  public static getAttributeName(str: string, pos: number) {
    return this.findPattern(
      str,
      pos,
      /(\s+(([a-z0-9\-_]+:)?[a-z0-9\-_]+)(\s*=\s*)?)/gi
    );
  }

  public static findPattern(str: string, pos: number, regex: RegExp) {
    regex.lastIndex = pos;
    const match = regex.exec(str);
    if (!match || match.index !== pos) {
      return undefined;
    } else {
      return {
        length: match[1].length,
        match
      };
    }
  }
}
