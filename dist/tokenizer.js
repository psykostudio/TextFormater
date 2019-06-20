export var defaultEntityMap;
(function (defaultEntityMap) {
    defaultEntityMap["quot"] = "\"";
    defaultEntityMap["amp"] = "&";
    defaultEntityMap["lt"] = "<";
    defaultEntityMap["gt"] = ">";
    defaultEntityMap["nbsp"] = "\u00A0";
})(defaultEntityMap || (defaultEntityMap = {}));
export var tokenTypes;
(function (tokenTypes) {
    tokenTypes["OPENING_TAG_END"] = "opening-tag-end";
    tokenTypes["OPENING_TAG"] = "opening-tag";
    tokenTypes["CLOSING_TAG"] = "closing-tag";
    tokenTypes["ATTRIBUTE"] = "attribute";
    tokenTypes["COMMENT"] = "comment";
    tokenTypes["START"] = "start";
    tokenTypes["CLOSE"] = "close";
    tokenTypes["OPEN"] = "open";
    tokenTypes["TEXT"] = "text";
    tokenTypes["DONE"] = "done";
})(tokenTypes || (tokenTypes = {}));
const states = {
    inTag: Symbol(),
    inComment: Symbol(),
    inText: Symbol(),
    inScript: Symbol()
};
export class Tokenizer {
    constructor(opts = {}) {
        this.entityMap = Object.assign({}, defaultEntityMap, opts.entities);
        Object.freeze(this);
    }
    entities(map) {
        Object.assign(this.entityMap, map);
    }
    *tokenize(html) {
        let currentText;
        for (const tkn of this._tokenize(html)) {
            if (tkn.type === tokenTypes.TEXT) {
                const text = tkn.text;
                if (currentText === undefined) {
                    currentText = text;
                }
                else {
                    currentText += text;
                }
            }
            else {
                if (currentText) {
                    const deentText = Tokenizer.deentityify(currentText, this.entityMap);
                    yield { type: tokenTypes.TEXT, text: deentText, name: "" };
                    currentText = undefined;
                }
                yield tkn;
            }
        }
    }
    *_tokenize(html) {
        yield { type: tokenTypes.START, name: "" };
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
                }
                else if (isBracket && (next = Chunk.getClosingTag(html, pos))) {
                    pos += next.length;
                    yield { type: tokenTypes.CLOSING_TAG, name: next.match[2] };
                }
                else if ((next = Chunk.getText(html, pos))) {
                    pos += next.length;
                    yield { type: tokenTypes.TEXT, name: currentTag, text: next.match[1] };
                }
                else {
                    const text = html.substring(pos, pos + 1);
                    pos += 1;
                    yield { type: tokenTypes.TEXT, name: currentTag, text };
                }
            }
            else if (state === states.inTag) {
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
                    }
                    else {
                        yield { type: tokenTypes.ATTRIBUTE, name, value: "" };
                    }
                }
                else if ((next = Chunk.getTagEnd(html, pos))) {
                    pos += next.length;
                    const token = next.match[2];
                    yield { type: tokenTypes.OPENING_TAG_END, name: currentTag, token };
                    state = currentTag === "script" ? states.inScript : states.inText;
                }
                else {
                    state = states.inText;
                }
            }
            else {
                break;
            }
        }
        yield { type: tokenTypes.DONE, name: "" };
    }
    static getHandler(map) {
        let handler = this.handlers.get(map);
        if (!handler) {
            const callback = function (ent, isNum, content) {
                if (isNum) {
                    const num = content.charAt(0) === "x"
                        ? parseInt("0" + content, 16)
                        : parseInt(content, 10);
                    return String.fromCharCode(num);
                }
                else {
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
    static deentityify(text, map) {
        const handler = this.getHandler(map);
        return handler(text);
    }
    static readAttribute(str, pos) {
        const quote = str.charAt(pos);
        const pos1 = pos + 1;
        if (Tokenizer.quotes.has(quote)) {
            const nextQuote = str.indexOf(quote, pos1);
            if (nextQuote === -1) {
                return { length: str.length - pos, value: str.substring(pos1) };
            }
            else {
                return {
                    length: nextQuote - pos + 1,
                    value: str.substring(pos1, nextQuote)
                };
            }
        }
        else {
            Tokenizer.readAttributePattern.lastIndex = pos;
            const match = Tokenizer.readAttributePattern.exec(str);
            return { length: match[1].length, value: match[2] };
        }
    }
}
Tokenizer.handlerPattern = /&(#?)([a-z0-9]+);/gi;
Tokenizer.handlers = new WeakMap();
Tokenizer.readAttributePattern = /(\s*([^>\s]*))/g;
Tokenizer.quotes = new Set("\"'");
export class Chunk {
    static getOpeningTag(str, pos) {
        return this.findPattern(str, pos, /(<(([a-z0-9-]+:)?[a-z0-9-]+))/gi);
    }
    static getText(str, pos) {
        return this.findPattern(str, pos, /([^<]+)/g);
    }
    static getClosingTag(str, pos) {
        return this.findPattern(str, pos, /(<\/(([a-z0-9-]+:)?[a-z0-9-]+)>)/gi);
    }
    static getTagEnd(str, pos) {
        return this.findPattern(str, pos, /(\s*(\/?>))/g);
    }
    static getAttributeName(str, pos) {
        return this.findPattern(str, pos, /(\s+(([a-z0-9\-_]+:)?[a-z0-9\-_]+)(\s*=\s*)?)/gi);
    }
    static findPattern(str, pos, regex) {
        regex.lastIndex = pos;
        const match = regex.exec(str);
        if (!match || match.index !== pos) {
            return undefined;
        }
        else {
            return {
                length: match[1].length,
                match
            };
        }
    }
}
//# sourceMappingURL=tokenizer.js.map