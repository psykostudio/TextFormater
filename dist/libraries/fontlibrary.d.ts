/// <reference types="opentype" />
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
    letterSpacing?: number;
}
export interface FontStyles {
    [styleName: string]: FontStyle;
}
export declare class FontLibrary {
    private static fontsByName;
    private static _defaultFontFamily;
    static loadFonts(fonts: {
        path: string;
        name: string;
    }[]): Promise<boolean>;
    static loadFont(fontFile: {
        path: string;
        name: string;
    }): Promise<Font>;
    static addFont(id: any, fontDatas: any): void;
    static registerFont(id: any, font: any): void;
    static getFontFromStyle(style: any): Font;
    private static findBestMatchForStyle(style);
    private static getFontByName(name);
}
