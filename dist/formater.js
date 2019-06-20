import { Tokenizer, tokenTypes } from "./tokenizer";
import { CanvasTextRenderer } from "./renderer";
import { Leaf, LeafType } from "./leaf";
import { FontLibrary } from "./libraries/fontlibrary";
export class Formater {
    constructor() {
        this.tokenizer = new Tokenizer();
        this.renderer = new CanvasTextRenderer();
        this._observers = [];
        this.wordWrap = 0;
        this._defaultStyles = {
            default: { color: "black" },
            b: { fontWeight: "Bold" },
            i: { fontStyle: "Italic" },
            a: { color: "blue", underlineWeight: 1, underlineDistance: 2 }
        };
        this._styles = {};
    }
    setStyles(value) {
        this._styles = {};
        this.addStyles(this._defaultStyles);
        this.addStyles(value);
    }
    addStyles(value) {
        Object.keys(value).forEach(key => {
            if (typeof value[key] === "object") {
                this.setStyleByName(key, value[key]);
            }
            else {
                this.setStyleByName("default", value);
            }
        });
    }
    setStyleByName(name, style) {
        const currentStyle = Object.assign({}, this._styles[name]);
        const newStyle = Object.assign({}, style);
        if (currentStyle !== newStyle) {
            this._styles[name] = Object.assign(currentStyle, newStyle);
        }
    }
    RegisterObserver(observer) {
        this._observers.push(observer);
    }
    RemoveObserver(observer) {
        this._observers.forEach((registered, index) => {
            if (registered === observer) {
                this._observers.splice(index, 1);
            }
        });
    }
    NotifyObservers() {
        this._observers.forEach((observer) => {
            observer.ReceiveNotification("UPDATE");
        });
    }
    parse(text) {
        const itr = this.tokenizer.tokenize(text);
        const styles = [];
        const attributes = [];
        const tokens = [];
        this.leaves = [];
        const tags = [];
        let tagLevel = -1;
        let tokenAttributes;
        let tokenStyle;
        let font;
        for (const token of itr) {
            switch (token.type) {
                case tokenTypes.OPENING_TAG:
                    tags.push(token.name);
                    styles.push(this._styles[token.name]);
                    attributes.push(new TokenAttributes());
                    tagLevel++;
                    break;
                case tokenTypes.ATTRIBUTE:
                    attributes[tagLevel].push(new TokenAttribute(token));
                    if (token.name === "style") {
                        styles.push(this.extractCustumStyle(token.value));
                    }
                    break;
                case tokenTypes.CLOSING_TAG:
                    // console.log(tags[tags.length - 1], attributes[tagLevel]);
                    token.name = tags[tags.length - 1];
                    if (token.name === "img") {
                        tokenAttributes = this.mergeAttributesLists(attributes);
                        tokenStyle = this.assign(styles, this._styles.default);
                        font = FontLibrary.getFontFromStyle(tokenStyle);
                        tokenStyle[`font`] = font;
                        token[`tag`] = token.name;
                        token[`style`] = tokenStyle;
                        token[`attributes`] = tokenAttributes;
                        token[`glyphs`] = [];
                        this.leaves.length > 0 ? this.leaves[this.leaves.length - 1] : null;
                        const leaf = new Leaf("", token, this.renderer);
                        leaf.previous =
                            this.leaves.length > 0 ? this.leaves[this.leaves.length - 1] : null;
                        this.leaves.push(leaf);
                    }
                    tags.pop();
                    styles.pop();
                    attributes.pop();
                    tagLevel--;
                    break;
                case tokenTypes.TEXT:
                    tokenAttributes = this.mergeAttributesLists(attributes);
                    tokenStyle = this.assign(styles, this._styles.default);
                    font = FontLibrary.getFontFromStyle(tokenStyle);
                    token.name = tags[tags.length - 1];
                    tokenStyle[`font`] = font;
                    token[`tag`] = token.name;
                    token[`style`] = tokenStyle;
                    token[`attributes`] = tokenAttributes;
                    token[`glyphs`] = [];
                    const reg = /(\s+)/g;
                    token.text.split(reg).forEach(match => {
                        if (match !== "") {
                            this.leaves.length > 0 ? this.leaves[this.leaves.length - 1] : null;
                            const leaf = new Leaf(match, token, this.renderer);
                            leaf.previous =
                                this.leaves.length > 0
                                    ? this.leaves[this.leaves.length - 1]
                                    : null;
                            this.leaves.push(leaf);
                        }
                    });
                    /*
                    let leaves = [];
                    const allChar = token.text.split("");
                    allChar.forEach(char => {
                      leaves.length > 0 ? leaves[leaves.length - 1] : null;
                      const leaf = new Leaf(char, token, this.renderer);
                      leaf.previous =
                        leaves.length > 0
                          ? leaves[leaves.length - 1]
                          : null;
                      switch(leaf.type){
                        case LeafType.Space:
                        case LeafType.NewLine:
                        case LeafType.Tabulation:
                        let wordLeaf = new Leaf("", token, this.renderer);
                        wordLeaf.addChild(leaves);
                        this.leaves.push(wordLeaf);
                        break;
                        case LeafType.Glyph:
                        leaves.push(leaf);
                        break;
                        case LeafType.Word:
                        break;
                      }
                    });
                    */
                    delete token.type;
                    break;
            }
        }
        this.composeLines(this.leaves);
    }
    composeLines(leaves) {
        let lastX = 0;
        let lastY = 0;
        let maxHeight = 0;
        let maxWidth = 0;
        leaves.forEach(leaf => {
            if (lastY === 0) {
                lastY = leaf.baseLine;
            }
            leaf.y = lastY;
            switch (leaf.type) {
                case LeafType.NewLine:
                    lastX = 0;
                    lastY += maxHeight;
                    maxHeight = 0;
                    break;
                case LeafType.Tabulation:
                case LeafType.Space:
                    leaf.x = lastX;
                    leaf.y = lastY;
                    lastX += leaf.width + leaf.letterSpacing;
                    break;
                case LeafType.Glyph:
                case LeafType.Word:
                case LeafType.Image:
                    if (this.wordWrap && this.wordWrap > 0) {
                        if (lastX + leaf.width > this.wordWrap) {
                            lastX = 0;
                            lastY += maxHeight;
                            maxHeight = 0;
                        }
                    }
                    leaf.x = lastX;
                    leaf.y = lastY;
                    leaf.getPath();
                    lastX += leaf.width;
                    maxHeight = Math.max(maxHeight, leaf.height + leaf.lineHeight);
                    maxWidth = Math.max(maxWidth, lastX);
                    break;
            }
        });
        this.width = Math.max(maxWidth, lastX);
        this.height = lastY;
        this.NotifyObservers();
    }
    assign(from, to) {
        let style = Object.assign({}, to);
        from.forEach(styleToAdd => {
            style = Object.assign(style, styleToAdd);
        });
        return style;
    }
    mergeAttributesLists(all) {
        const to = new TokenAttributes();
        for (let i = 0; i < all.length; i++) {
            all[i].attributes.forEach(attribute => {
                to.push(attribute);
            });
        }
        return to;
    }
    extractCustumStyle(value) {
        const styleString = value.replace(/ /g, "").split(";");
        let style = {};
        styleString.forEach(str => {
            const styleArray = str.split(":");
            style[styleArray[0]] = styleArray[1];
        });
        return style;
    }
}
export class TokenAttributes {
    constructor() {
        this.attributes = [];
    }
    push(attribute) {
        this.attributes.push(attribute);
    }
    pop() {
        return this.attributes.pop();
    }
    getByName(name) {
        return this.attributes.find((attribute) => {
            return attribute.name === name;
        });
    }
}
export class TokenAttribute {
    constructor(token) {
        this.name = token.name;
        this.value = token.value;
    }
    get asInteger() {
        return parseInt(this.value);
    }
    get asFloat() {
        return parseFloat(this.value);
    }
}
//# sourceMappingURL=formater.js.map