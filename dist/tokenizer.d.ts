export declare enum defaultEntityMap {
    quot = "\"",
    amp = "&",
    lt = "<",
    gt = ">",
    nbsp = "\u00A0",
}
export declare enum tokenTypes {
    OPENING_TAG_END = "opening-tag-end",
    OPENING_TAG = "opening-tag",
    CLOSING_TAG = "closing-tag",
    ATTRIBUTE = "attribute",
    COMMENT = "comment",
    START = "start",
    CLOSE = "close",
    OPEN = "open",
    TEXT = "text",
    DONE = "done",
}
export interface Entity {
    [name: string]: string;
}
export interface TokenizerOptions {
    entities?: Entity;
}
export interface Token {
    type: tokenTypes;
    name: string;
    text?: string;
    value?: string;
    token?: string;
}
export declare class Tokenizer {
    private entityMap;
    constructor(opts?: TokenizerOptions);
    entities(map: any): void;
    tokenize(html: any): IterableIterator<Token>;
    private _tokenize(html);
    private static handlerPattern;
    private static handlers;
    private static getHandler(map);
    private static deentityify(text, map);
    private static readAttributePattern;
    private static quotes;
    private static readAttribute(str, pos);
}
export declare class Chunk {
    static getOpeningTag(str: string, pos: number): {
        length: number;
        match: RegExpExecArray;
    };
    static getText(str: string, pos: number): {
        length: number;
        match: RegExpExecArray;
    };
    static getClosingTag(str: string, pos: number): {
        length: number;
        match: RegExpExecArray;
    };
    static getTagEnd(str: string, pos: number): {
        length: number;
        match: RegExpExecArray;
    };
    static getAttributeName(str: string, pos: number): {
        length: number;
        match: RegExpExecArray;
    };
    static findPattern(str: string, pos: number, regex: RegExp): {
        length: number;
        match: RegExpExecArray;
    };
}
