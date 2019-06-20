/// <reference types="opentype" />
import { Glyph, Font, Path } from "opentype.js";
import { TokenAttributes } from "./formater";
import { TextRenderer } from "./renderer";
import { FontStyle } from "./libraries/fontlibrary";
export declare enum LeafType {
    Space = "Space",
    NewLine = "NewLine",
    Tabulation = "Tabulation",
    Word = "Word",
    Glyph = "Glyph",
    Image = "Image",
}
export declare class Leaf {
    text: string;
    token: any;
    children: Leaf[];
    glyph: Glyph;
    style: FontStyle;
    font: Font;
    fontSize: number;
    fontRatio: number;
    private _x;
    private _y;
    width: number;
    height: number;
    type: LeafType;
    path: Path;
    attributes: TokenAttributes;
    image: HTMLImageElement;
    baseLine: number;
    lineHeight: number;
    letterSpacing: number;
    renderer: TextRenderer;
    private _previous;
    private _next;
    private _parent;
    constructor(text: string, token: any, renderer: TextRenderer, parent?: Leaf, previous?: Leaf);
    private identify();
    drawImage(context: CanvasRenderingContext2D, offsetX?: number, offsetY?: number): void;
    private loadImage(cb);
    contains(point: {
        x: number;
        y: number;
    }): boolean;
    draw(context: CanvasRenderingContext2D, offsetX?: number, offsetY?: number): void;
    getPath(): Path;
    readonly roundedPosition: {
        x: number;
        y: number;
    };
    private getGlyphBound();
    private buildGlyph();
    private splitInGlyphs();
    addChild(childs: Leaf | Leaf[]): void;
    parent: Leaf;
    previous: Leaf;
    next: Leaf;
    x: number;
    y: number;
}
