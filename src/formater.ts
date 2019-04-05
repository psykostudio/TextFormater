import { Tokenizer, tokenTypes } from "./tokenizer";
import { Glyph, Font } from "opentype.js";

export class Formater {
  private tokenizer: Tokenizer = new Tokenizer();
  private styles = {
    default: { fontName: "Calibri", fontSize: 20, color: "#000000" },
    b: { fontName: "Calibri Bold" },
    a: { color: "#0000FF", underline: true }
  };

  private fonts: { [name: string]: Font } = {};

  public async loadFonts(fonts: { path: string; name: string }[]) {
    const files = [];
    console.log(fonts);
    fonts.forEach(fontFile => {
      files.push(this.loadFont(fontFile));
    });

    await Promise.all(files);
    console.log(`${files.length} fonts loaded`);
    return true;
  }

  public async loadFont(fontFile: { path: string; name: string }) {
    return new Promise<Font>((resolve, reject) => {
      opentype.load(fontFile.path, (err, font) => {
        if (err) {
          reject("Could not load font: " + err);
        } else {
          this.fonts[fontFile.name] = font;
          console.log(`font ${fontFile.name} loaded`);
          resolve(font);
        }
      });
    });
  }

  public parse(text: string) {
    const itr = this.tokenizer.tokenize(text);
    const styles = [];
    const attributes = [];

    for (const token of itr) {
      switch (token.type) {
        case tokenTypes.OPENING_TAG:
          const tag = token[`name`];
          styles.push(this.styles[tag]);
          attributes.push([]);
          break;
        case tokenTypes.ATTRIBUTE:
          if (token[`name`] === "style") {
            styles.push(this.extractCustumStyle(token[`value`]));
          }
          attributes[attributes.length - 1].push({
            name: (token as any).name,
            value: (token as any).value
          });
          break;
        case tokenTypes.CLOSING_TAG:
          styles.pop();
          attributes.pop();
          break;
        case tokenTypes.TEXT:
          token[`style`] = this.mergeStyles(styles);
          const font = this.getFont(token[`style`].fontName);
          token[`attributes`] = Object.assign(
            {},
            attributes[attributes.length - 1]
          );
          token[`glyphs`] = [];
          token.text.split("").forEach((char: string) => {
            const glyph = font.charToGlyph(char);
            token[`glyphs`].push(glyph);
          });
          delete token.type;
          console.log(token);
          // here i can split string in characters and build glyphs with their boundaries
          break;
      }
    }
  }

  private getFont(name) {
    return this.fonts[name];
  }

  private mergeStyles(styles) {
    let style = Object.assign({}, this.styles.default);
    styles.forEach(styleToAdd => {
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
