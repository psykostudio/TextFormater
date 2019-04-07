import { Tokenizer, tokenTypes, Chunk } from "./tokenizer";
import { Glyph, Font } from "opentype.js";
import { CanvasTextRenderer } from ".";
import { Leaf } from "./Leaf";

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
  underlineWeight?: number;
  underlineDistance?: number;
}
export interface FontStyles {
  [styleName: string]: FontStyle;
}

export class Formater {
  private tokenizer: Tokenizer = new Tokenizer();
  private renderer: CanvasTextRenderer = new CanvasTextRenderer();

  private _styles: FontStyles = {
    default: { color: "black" },
    b: { fontWeight: "Bold" },
    i: { fontStyle: "Italic" },
    a: { color: "blue", underlineWeight: 1, underlineDistance: 2 }
  };

  private fonts: { [name: string]: Font } = {};

  public async loadFonts(fonts: { path: string; name: string }[]) {
    const files = [];
    fonts.forEach(fontFile => {
      files.push(this.loadFont(fontFile));
    });

    await Promise.all(files);
    console.log(`Formater: ${files.length} fonts loaded`, this.fonts);
    return true;
  }

  public async loadFont(fontFile: { path: string; name: string }) {
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

    if (!this.defaultFontFamily) {
      this.defaultFontFamily = fontFamily;
    }

    this.fonts[`${fontFamily} ${fontSubfamily}`] = font;
    this.fonts[`${postScriptName}`] = font;
    this.fonts[`${fullName}`] = font;

    console.log(
      `Formater: font loaded\n\tfullName:${fullName}\n\tfamily:${fontFamily}\n\tsub familly:${fontSubfamily}\n\tpostscript:${postScriptName}`
    );
  }

  public set defaultFontFamily(fontFamily) {
    this._styles.default.fontName = fontFamily;
  }

  public get defaultFontFamily() {
    return this._styles.default.fontName;
  }

  public setStyles(value: FontStyle | FontStyles) {
    Object.keys(value).forEach(key => {
      if (typeof value[key] === "object") {
        this.setStyleByName(key, value[key]);
      } else {
        this.setStyleByName("default", value);
      }
    });
  }

  private setStyleByName(name: string, style: FontStyle) {
    const currentStyle = Object.assign({}, this._styles[name]);
    const newStyle = Object.assign({}, style);
    if (currentStyle !== newStyle) {
      this._styles[name] = Object.assign(currentStyle, newStyle);
      this.markAsDirty();
    }
  }

  private markAsDirty() {}

  private load(fontFile) {
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
    const attributes = [];
    const tokens = [];
    const leafs = [];
    let tagLevel = -1;

    for (const token of itr) {
      switch (token.type) {
        case tokenTypes.OPENING_TAG:
          const tag = token[`name`];
          styles.push(this._styles[tag]);
          attributes.push([]);
          tagLevel++;
          break;
        case tokenTypes.ATTRIBUTE:
          attributes[tagLevel].push({
            name: (token as any).name,
            value: (token as any).value
          });
          if (token[`name`] === "style") {
            styles.push(this.extractCustumStyle(token[`value`]));
          }
          break;
        case tokenTypes.CLOSING_TAG:
          styles.pop();
          attributes.pop();
          tagLevel--;
          break;
        case tokenTypes.TEXT:
          const tokenStyle = this.assign(styles, this._styles.default);
          const tokenAttributes = this.assign(attributes, {});
          const font = this.getFontFromStyle(tokenStyle);

          tokenStyle[`font`] = font;
          token[`style`] = tokenStyle;
          token[`attributes`] = tokenAttributes;
          token[`glyphs`] = [];

          const reg = /(\s+)/g;
          // console.log({ source: token.text, result: token.text.split(reg) });
          token.text.split(reg).forEach(match => {
            if(match !== ""){
              const previous = leafs.length > 0 ? leafs[leafs.length - 1] : null;
              const leaf = new Leaf(match, token, this.renderer, null, previous);
              leafs.push(leaf);
            }
          });
         
          /*
          token.text.split("").forEach((char: string) => {
            const glyph = token[`style`].font.charToGlyph(char);
            token[`glyphs`].push(glyph);
          });*/

          delete token.type;
          //tokens.push(token);
          break;
      }
    }

    // i must have changed
    this.markAsDirty();

    this.renderer.clear();
    this.renderer.update(leafs);
    console.log(this);
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
