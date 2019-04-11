import { Tokenizer, tokenTypes, Chunk } from "./tokenizer";
import { Glyph, Font } from "opentype.js";
import { CanvasTextRenderer } from "./renderer";
import { Leaf, LeafType } from "./Leaf";

export interface Token {
  attributes: any;
  glyphs: Glyph[];
  style: any;
  text: string;
}

export interface FontStyle {
  fontName?: string;
  fontFamilly?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  stroke?: string;
  strokeWidth?: number;
  underlineWeight?: number;
  underlineDistance?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  font?: Font;
}
export interface FontStyles {
  [styleName: string]: FontStyle;
}

export class Formater {
  private tokenizer: Tokenizer = new Tokenizer();
  private renderer: CanvasTextRenderer = new CanvasTextRenderer();
  public leafs: Leaf[];

  private _defaultStyles: FontStyles = {
    default: { color: "black" },
    b: { fontWeight: "Bold" },
    i: { fontStyle: "Italic" },
    a: { color: "blue", underlineWeight: 1, underlineDistance: 2 }
  };

  private _styles: FontStyles = {};

  private fonts: { [name: string]: Font } = {};

  public async loadFonts(
    fonts: { path: string; name: string }[]
  ): Promise<boolean> {
    const files = [];
    fonts.forEach(fontFile => {
      files.push(this.loadFont(fontFile));
    });

    await Promise.all(files);
    console.log(`Formater: ${files.length} fonts loaded`, this.fonts);
    return true;
  }

  public async loadFont(fontFile: {
    path: string;
    name: string;
  }): Promise<Font> {
    return new Promise<Font>((resolve, reject) => {
      opentype.load(fontFile.path, (err, font) => {
        if (err) {
          reject("Could not load font: " + err);
        } else {
          // store it for later use
          this.registerFont(font);
          resolve(font);
        }
      });
    });
  }

  private registerFont(font) {
    const fontFamily = font.getEnglishName("fontFamily");
    const fontSubfamily = font.getEnglishName("fontSubfamily");
    const fullName = font.getEnglishName("fullName");
    const postScriptName = font.getEnglishName("postScriptName");

    if (!this._defaultFontFamily) {
      this._defaultFontFamily = fontFamily;
    }

    this.fonts[`${fontFamily} ${fontSubfamily}`] = font;
    this.fonts[`${postScriptName}`] = font;
    this.fonts[`${fullName}`] = font;

    console.log(
      `Formater: font loaded\n\tfullName:${fullName}\n\tfamily:${fontFamily}\n\tsub familly:${fontSubfamily}\n\tpostscript:${postScriptName}`
    );
  }

  private _defaultFontFamily: string;

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

  private load(fontFile): Promise<string> {
    return new Promise((resolve, reject) => {
      var xobj = new XMLHttpRequest();
      xobj.open("GET", fontFile.path, true);
      xobj.onreadystatechange = () => {
        if (xobj.readyState === 4 && xobj.status === 200) {
          resolve(xobj.responseText);
        } else {
          reject();
        }
      };
      xobj.send();
    });
  }

  public parse(text: string) {
    const itr = this.tokenizer.tokenize(text);
    const styles = [];
    const attributes: TokenAttributes[] = [];
    const tokens = [];
    this.leafs = [];
    const tags = [];
    let tagLevel = -1;
    let currentTag;
    let tokenAttributes;
    let tokenStyle;
    let font;

    for (const token of itr) {
      switch (token.type) {
        case tokenTypes.OPENING_TAG:
          currentTag = token[`name`];
          tags.push(currentTag);
          styles.push(this._styles[currentTag]);
          attributes.push(new TokenAttributes());
          tagLevel++;
          break;
        case tokenTypes.ATTRIBUTE:
          attributes[tagLevel].push(new TokenAttribute(token));
          if (token[`name`] === "style") {
            styles.push(this.extractCustumStyle(token[`value`]));
          }
          break;
        case tokenTypes.CLOSING_TAG:
          // console.log(tags[tags.length - 1], attributes[tagLevel]);
          currentTag = tags[tags.length - 1];

          if (currentTag === "img") {
            tokenAttributes = this.mergeAttributesLists(attributes);
            tokenStyle = this.assign(styles, this._styles.default);
            font = this.getFontFromStyle(tokenStyle);

            tokenStyle[`font`] = font;
            token[`tag`] = currentTag;
            token[`style`] = tokenStyle;
            token[`attributes`] = tokenAttributes;
            token[`glyphs`] = [];

            console.log(currentTag, attributes, tokenAttributes);

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
          font = this.getFontFromStyle(tokenStyle);
          currentTag = tags[tags.length - 1];

          tokenStyle[`font`] = font;
          token[`tag`] = currentTag;
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
    console.log(this);
  }

  private composeLines(leafs: Leaf[]) {
    let lastX: number = 0;
    let lastY: number = 0;
    let maxHeight: number = 0;
    let maxWidth: number = 400;

    leafs.forEach(leaf => {
      if (lastY === 0) {
        lastY = leaf.font.ascender * leaf.fontRatio;
      }

      leaf.y = lastY;

      switch (leaf.type) {
        case LeafType.NewLine:
          lastY += maxHeight;
          maxHeight = 0;
          lastX = 0;
          break;
        case LeafType.Tabulation:
        case LeafType.Space:
          leaf.x = lastX;
          leaf.y = lastY;
          lastX += leaf.width;
          break;
        case LeafType.Glyph:
        case LeafType.Word:
        case LeafType.Image:
          if (lastX + leaf.width > maxWidth) {
            lastY += maxHeight;
            maxHeight = 0;
            lastX = 0;
          }
          leaf.x = lastX;
          leaf.y = lastY;
          leaf.getPath();
          maxHeight = Math.max(maxHeight, leaf.height);
          lastX += leaf.width;
          break;
      }
    });

    this.renderer.clear();
    this.renderer.update(this.leafs);
  }

  private getFontFromStyle(style) {
    const preferencesOrder = [
      `${style.fontFamily} ${style.fontWeight} ${style.fontStyle}`,
      `${style.fontName} ${style.fontWeight} ${style.fontStyle}`,
      `${style.fontFamily} ${style.fontWeight}`,
      `${style.fontName} ${style.fontWeight}`,
      `${style.fontFamily} ${style.fontStyle}`,
      `${style.fontName} ${style.fontStyle}`,

      `${style.fontFamily}`,
      `${style.fontName}`
    ];

    const bestMatch = preferencesOrder.find(order => {
      return this.getFontByName(order) ? true : false;
    });

    return this.getFontByName(bestMatch);
  }

  private getFontByName(name) {
    return this.fonts[name];
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
