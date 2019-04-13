import { Font } from "opentype.js";

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
  lineHeight?: number;
}

export interface FontStyles {
  [styleName: string]: FontStyle;
}

export class FontLibrary {
  private static fontsByName: { [name: string]: Font } = {};
  private static _defaultFontFamily: string;

  public static async loadFonts(
    fonts: { path: string; name: string }[]
  ): Promise<boolean> {
    const files = [];
    fonts.forEach(fontFile => {
      files.push(this.loadFont(fontFile));
    });

    await Promise.all(files);
    console.log(`Formater: ${files.length} fonts loaded`, this.fontsByName);
    return true;
  }

  public static async loadFont(fontFile: {
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

  private static registerFont(font) {
    const fontFamily = font.getEnglishName("fontFamily");
    const fontSubfamily = font.getEnglishName("fontSubfamily");
    const fullName = font.getEnglishName("fullName");
    const postScriptName = font.getEnglishName("postScriptName");

    if (!this._defaultFontFamily) {
      this._defaultFontFamily = fontFamily;
    }

    this.fontsByName[`${fontFamily} ${fontSubfamily}`] = font;
    this.fontsByName[`${postScriptName}`] = font;
    this.fontsByName[`${fullName}`] = font;

    console.log(
      `Formater: font loaded\n\tfullName:${fullName}\n\tfamily:${fontFamily}\n\tsub familly:${fontSubfamily}\n\tpostscript:${postScriptName}`
    );
  }

  public static getFontFromStyle(style) {
    return this.getFontByName(this.findBestMatchForStyle(style));
  }

  private static findBestMatchForStyle(style) {
    const preferedOrder = [
      `${style.fontFamily} ${style.fontWeight} ${style.fontStyle}`,
      `${style.fontName} ${style.fontWeight} ${style.fontStyle}`,
      `${style.fontFamily} ${style.fontWeight}`,
      `${style.fontName} ${style.fontWeight}`,
      `${style.fontFamily} ${style.fontStyle}`,
      `${style.fontName} ${style.fontStyle}`,

      `${style.fontFamily}`,
      `${style.fontName}`,
      `${this._defaultFontFamily}`
    ];

    const bestMatch = preferedOrder.find(order => {
      return this.getFontByName(order) ? true : false;
    });

    return bestMatch;
  }

  private static getFontByName(name) {
    return this.fontsByName[name];
  }
}
