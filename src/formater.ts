import { Tokenizer, tokenTypes } from "./tokenizer";
import { Glyph, Font } from "opentype.js";
import { fontkit } from "fontkit";
import { CanvasTextRenderer } from ".";

export interface Token {
  attributes: any;
  glyphs: Glyph[];
  style: any;
  text: string;
}

export class Formater {
  private tokenizer: Tokenizer = new Tokenizer();
  private renderer: CanvasTextRenderer = new CanvasTextRenderer();

  private styles = {
    default: { fontName: "Calibri", fontSize: 20, color: "black" },
    b: { fontWeight: "Bold" },
    i: { fontStyle: "Italic" },
    a: { color: "blue", underline: true }
  };

  private fonts: { [name: string]: Font } = {};

  public async loadFonts(fonts: { path: string; name: string }[]) {
    const files = [];
    fonts.forEach(fontFile => {
      files.push(this.loadFont(fontFile));
    });

    await Promise.all(files);
    console.log(`Formater: ${files.length} fonts loaded`);
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

    this.fonts[`${fontFamily} ${fontSubfamily}`] = font;
    this.fonts[`${postScriptName}`] = font;
    this.fonts[`${fullName}`] = font;

    console.log(`Formater: font loaded\n\tfullName:${fullName}\n\tfamily:${fontFamily}\n\tsub familly:${fontSubfamily}\n\tpostscript:${postScriptName}`);
  }

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
    let tagLevel = -1;

    for (const token of itr) {
      switch (token.type) {
        case tokenTypes.OPENING_TAG:
          const tag = token[`name`];
          styles.push(this.styles[tag]);
          attributes.push([]);
          tagLevel++;
          console.log("open tag", (token as any).name, tagLevel)
          break;
        case tokenTypes.ATTRIBUTE:
          attributes[tagLevel].push({
            name: (token as any).name,
            value: (token as any).value
          });
          if (token[`name`] === "style") {
            styles.push(this.extractCustumStyle(token[`value`]));
          }
          console.log("new attributes", (token as any).name, tagLevel)
          break;
        case tokenTypes.CLOSING_TAG:
          styles.pop();
          attributes.pop();
          tagLevel--;
          console.log("close tag", (token as any).name, tagLevel)
          break;
        case tokenTypes.TEXT:
          console.log("text", (token as any).text, tagLevel)
          const tokenStyle = this.mergeStyles(styles, this.styles.default);
          const tokenAttributes = this.mergeAttributes(attributes);
          
          tokenStyle[`font`] = this.getFontFromStyle(tokenStyle);
          token[`style`] = tokenStyle;
          token[`attributes`] = tokenAttributes;
          token[`glyphs`] = [];

          token.text.split("").forEach((char: string) => {
            const glyph = token[`style`].font.charToGlyph(char);
            token[`glyphs`].push(glyph);
          });
          delete token.type;
          tokens.push(token);
          break;
      }
    }
    // i must have changed
    this.renderer.clear();
    this.renderer.update(tokens);
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

  private mergeStyles(styles, defaultStyle) {
    let style = Object.assign({}, defaultStyle);
    styles.forEach(styleToAdd => {
      style = Object.assign(style, styleToAdd);
    });
    return style;
  }

  private mergeAttributes(attributes) {
    let attribute = {}
    attributes.forEach(attributeToAdd => {
      attribute = Object.assign(attribute, attributeToAdd);
    });
    return attribute;
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
