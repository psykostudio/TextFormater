import { load, parse, Font } from "opentype.js";
import typr from "typr.js";
// import * as typr from '@fredli74/typr';

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
  letterSpacing?: number;
  width?: string | number;
  height?: string | number;
}

export interface FontStyles {
  [styleName: string]: FontStyle;
}

export class FontLibrary {
  private static fontsByName: { [name: string]: Font } = {};
  private static _fontsByName: { [name: string]: any } = {};
  private static _defaultFontFamily: string;

  public static async loadFonts(
    fonts: { path: string; name: string }[]
  ): Promise<boolean> {
    const files = [];
    fonts.forEach(fontFile => {
      files.push(this.loadFont(fontFile));
    });

    await Promise.all(files);
    return true;
  }

  public static async loadFont(fontFile: {
    path: string;
    name: string;
  }): Promise<Font> {
    return new Promise<Font>((resolve, reject) => {
      this.load(fontFile.name, fontFile.path);

      load(fontFile.path, (err, font) => {
        if (err) {
          reject("Could not load font: " + err);
        } else {
          // store it for later use
          this.registerFont(fontFile.name, font);

          resolve(font);
        }
      });
    });
  }

  private static load(id: string, path: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      var request = new XMLHttpRequest();
      request.open("GET", path, true);
      request.responseType = "arraybuffer";

      request.onerror = (err) => {
        reject(`Could not load font: ${err}`);
      };

      request.onload = (e: ProgressEvent) => {
        const ratio = e.loaded / e.total;
        // console.log(id, ratio);
      };

      request.onloadend = (e: ProgressEvent) => {
        const target: XMLHttpRequest = e.target as XMLHttpRequest;
        // const font = new typr.Font(target.response);
        const font = typr.parse(target.response);
        this._registerFont(id, font);
        resolve(font);
      };

      request.send();
    });
  }

  private static _registerFont(id: string, font: any): void {
    this._fontsByName[id] = font;
    this._fontsByName[font.name.ID] = font;
    // this._fontsByName[font.name.fontFamily] = font;
    this._fontsByName[font.name.fullName] = font;
    this._fontsByName[font.name.postScriptName] = font;
    this._fontsByName[`${font.name.fontFamily} ${font.name.fontSubfamily}`] = font;
  }

  public static addFont(id, fontDatas) {
    const font = parse(fontDatas);
    this.registerFont(id, font);
  }

  public static registerFont(id, font) {
    const fontFamily = font.getEnglishName("fontFamily");
    const fontSubfamily = font.getEnglishName("fontSubfamily");
    const fullName = font.getEnglishName("fullName");
    const postScriptName = font.getEnglishName("postScriptName");

    if (!this._defaultFontFamily) {
      this._defaultFontFamily = fontFamily;
    }

    this.fontsByName[`${id}`] = font;
    this.fontsByName[`${fontFamily} ${fontSubfamily}`] = font;
    this.fontsByName[`${postScriptName}`] = font;
    this.fontsByName[`${fullName}`] = font;

    /*console.info(
      `FontLibrary: font loaded`, {
      id,
      fullName,
      fontFamily,
      fontSubfamily,
      postScriptName,
      font
    });*/
  }

  public static getTyprFontFromStyle(style): any {
    return this.getTyprFontByName(this.findBestTyprMatchForStyle(style));
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

    const bestMatch = preferedOrder.find((order) => {
      const found = this.getFontByName(order);
      return found ? true : false;
    });

    if (!bestMatch) {
      console.warn(`can't find font for style`, style);
    }

    return bestMatch;
  }

  private static getFontByName(name) {
    if (this.fontsByName[name]) {
      return this.fontsByName[name];
    } else {
      return null;
    }
  }

  private static findBestTyprMatchForStyle(style) {
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

    const bestMatch = preferedOrder.find((order) => {
      const found = this.getTyprFontByName(order);
      return found ? true : false;
    });

    if (!bestMatch) {
      console.warn(`can't find font for style`, style);
    }

    return bestMatch;
  }

  private static getTyprFontByName(name: string): any {
    if (this._fontsByName[name]) {
      return this._fontsByName[name];
    } else {
      return null;
    }
  }
}
