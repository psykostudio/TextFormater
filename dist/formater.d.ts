/// <reference types="opentype" />
import { Glyph } from "opentype.js";
import { CanvasTextRenderer } from "./renderer";
import { Leaf } from "./leaf";
import { FontStyle, FontStyles } from "./libraries/fontlibrary";
import { IObservable } from "./interfaces/IObservable";
import { IObserver } from "./interfaces/IObserver";
export interface Token {
    attributes: any;
    glyphs: Glyph[];
    style: any;
    text: string;
}
export declare class Formater implements IObservable {
    private tokenizer;
    renderer: CanvasTextRenderer;
    leaves: Leaf[];
    private _observers;
    wordWrap: number;
    width: number;
    height: number;
    private _defaultStyles;
    private _styles;
    setStyles(value: FontStyle | FontStyles): void;
    addStyles(value: FontStyle | FontStyles): void;
    setStyleByName(name: string, style: FontStyle): void;
    RegisterObserver(observer: IObserver): void;
    RemoveObserver(observer: IObserver): void;
    NotifyObservers(): void;
    parse(text: string): void;
    private composeLines(leaves);
    private assign(from, to);
    private mergeAttributesLists(all);
    private extractCustumStyle(value);
}
export declare class TokenAttributes {
    attributes: TokenAttribute[];
    push(attribute: TokenAttribute): void;
    pop(): TokenAttribute;
    getByName(name: string): TokenAttribute;
}
export declare class TokenAttribute {
    name: string;
    value: string;
    constructor(token: any);
    readonly asInteger: number;
    readonly asFloat: number;
}
