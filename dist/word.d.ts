/// <reference types="opentype" />
import { Glyph } from "opentype.js";
export declare class Leaf {
    raw: string;
    token: any;
    glyphs: Glyph[];
    style: any;
    font: any;
    fontSize: number;
    fontRatio: number;
    x: number;
    y: number;
    width: number;
    constructor(raw: string, token: any);
    draw(context: CanvasRenderingContext2D, renderOptions: any): void;
    private splitInGlyphs();
}
