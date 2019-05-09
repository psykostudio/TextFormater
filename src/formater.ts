import { Tokenizer, tokenTypes, Chunk } from "./tokenizer";
import { Glyph, Font } from "opentype.js";
import { CanvasTextRenderer } from "./renderer";
import { Leaf, LeafType } from "./Leaf";
import { FontLibrary, FontStyle, FontStyles } from "./FontLibrary";

export interface Token {
  attributes: any;
  glyphs: Glyph[];
  style: any;
  text: string;
}

export class Formater {
  private tokenizer: Tokenizer = new Tokenizer();
  public renderer: CanvasTextRenderer = new CanvasTextRenderer();
  public leafs: Leaf[];

  private _defaultStyles: FontStyles = {
    default: { color: "black" },
    b: { fontWeight: "Bold" },
    i: { fontStyle: "Italic" },
    a: { color: "blue", underlineWeight: 1, underlineDistance: 2 }
  };

  private _styles: FontStyles = {};

  public setStyles(value: FontStyle | FontStyles) {
    this._styles = {};
    this.addStyles(this._defaultStyles);
    this.addStyles(value);
  }

  public addStyles(value: FontStyle | FontStyles) {
    Object.keys(value).forEach(key => {
      if (typeof value[key] === "object") {
        this.setStyleByName(key, value[key]);
      } else {
        this.setStyleByName("default", value);
      }
    });
  }

  public setStyleByName(name: string, style: FontStyle) {
    const currentStyle = Object.assign({}, this._styles[name]);
    const newStyle = Object.assign({}, style);
    if (currentStyle !== newStyle) {
      this._styles[name] = Object.assign(currentStyle, newStyle);
      this.markAsDirty();
    }
  }

  private markAsDirty() {}

  public parse(text: string) {
    const itr = this.tokenizer.tokenize(text);
    const styles = [];
    const attributes: TokenAttributes[] = [];
    const tokens = [];
    this.leafs = [];
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

            this.leafs.length > 0 ? this.leafs[this.leafs.length - 1] : null;
            const leaf = new Leaf("", token, this.renderer);
            leaf.previous =
              this.leafs.length > 0 ? this.leafs[this.leafs.length - 1] : null;
            this.leafs.push(leaf);
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
              this.leafs.length > 0 ? this.leafs[this.leafs.length - 1] : null;
              const leaf = new Leaf(match, token, this.renderer);
              leaf.previous =
                this.leafs.length > 0
                  ? this.leafs[this.leafs.length - 1]
                  : null;
              this.leafs.push(leaf);
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
              this.leafs.push(wordLeaf);
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

    // i must have changed
    this.markAsDirty();
    this.composeLines(this.leafs);
  }

  private composeLines(leafs: Leaf[]) {
    let lastX: number = 0;
    let lastY: number = 0;
    let maxHeight: number = 0;
    let maxWidth: number = 2048;

    leafs.forEach(leaf => {
      if (lastY === 0) {
        lastY = leaf.font.ascender * leaf.fontRatio;
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
          if (lastX + leaf.width > maxWidth) {
            lastX = 0;
            lastY += maxHeight;
            maxHeight = 0;
          }
          leaf.x = lastX;
          leaf.y = lastY;
          leaf.getPath();
          maxHeight = Math.max(maxHeight, leaf.height + leaf.lineHeight);
          lastX += leaf.width;
          break;
      }
    });

    console.log(lastX, maxHeight);

    this.renderer.clear();
    this.renderer.update(this.leafs);
  }

  private assign(from, to) {
    let style = Object.assign({}, to);
    from.forEach(styleToAdd => {
      style = Object.assign(style, styleToAdd);
    });
    return style;
  }

  private mergeAttributesLists(all: TokenAttributes[]) {
    const to = new TokenAttributes();
    for (let i = 0; i < all.length; i++) {
      all[i].attributes.forEach(attribute => {
        to.push(attribute);
      });
    }
    return to;
  }

  private extractCustumStyle(value: string) {
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
  public attributes: TokenAttribute[] = [];

  public push(attribute: TokenAttribute) {
    this.attributes.push(attribute);
  }

  public pop() {
    return this.attributes.pop();
  }

  public getByName(name: string) {
    return this.attributes.find((attribute: TokenAttribute) => {
      return attribute.name === name;
    });
  }
}

export class TokenAttribute {
  public name: string;
  public value: string;

  constructor(token) {
    this.name = token.name;
    this.value = token.value;
  }

  public get asInteger(): number {
    return parseInt(this.value);
  }

  public get asFloat() {
    return parseFloat(this.value);
  }
}
