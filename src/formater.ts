import { Glyph } from "opentype.js";
import { Tokenizer, tokenTypes } from "./tokenizer";
import { TextRenderer } from "./renderers/renderer";
import { Leaf, LeafBackup, LeafType } from "./leaf";
import { FontLibrary, FontStyle, FontStyles } from "./libraries/fontlibrary";
import { IObservable } from "./interfaces/IObservable";
import { IObserver } from "./interfaces/IObserver";
import { Utils } from "./libraries/utils";
import { CanvasTextRenderer } from "./renderers/canvas/canvasrenderer";
import { Parser, Tokenizer as Tokenezer2 } from 'html-tokenizer';
import entities from 'html-tokenizer/lib/entities';
import typr from "typr.js";

export interface Token {
  attributes: any;
  glyphs: Glyph[];
  style: any;
  text: string;
}

export class Formater implements IObservable {
  private tokenizer: Tokenizer = new Tokenizer();
  public renderer: TextRenderer = CanvasTextRenderer.defaultRenderer();
  public leaves: LeafBackup[];

  private _observers: IObserver[] = [];

  public wordWrap: number = 0;
  public width: number;
  public height: number;

  private _defaultStyles: FontStyles = {
    default: { color: "black" },
    b: { fontWeight: "Bold" },
    i: { fontStyle: "Italic" },
    a: { color: "blue", underlineWeight: 1, underlineDistance: 2 }
  };

  private _styles: FontStyles = {};

  public setStyles(value: FontStyle | FontStyles) {
    this._styles = {};
    this.addStyles(this._defaultStyles);
    this.addStyles(value);
  }

  public addStyles(value: FontStyle | FontStyles) {
    Object.keys(value).forEach(key => {
      if (typeof value[key] === "object") {
        this.setStyleByName(key, value[key]);
      } else {
        this.setStyleByName("default", value);
      }
    });
  }

  public setStyleByName(name: string, style: FontStyle) {
    const currentStyle = Object.assign({}, this._styles[name]);
    const newStyle = Object.assign({}, style);
    if (currentStyle !== newStyle) {
      this._styles[name] = Object.assign(currentStyle, newStyle);
    }
  }

  public RegisterObserver(observer: IObserver) {
    this._observers.push(observer);
  }

  public RemoveObserver(observer: IObserver) {
    this._observers.forEach((registered, index) => {
      if (registered === observer) {
        this._observers.splice(index, 1);
      }
    });
  }

  public NotifyObservers() {
    this._observers.forEach((observer) => {
      observer.ReceiveNotification("UPDATE");
    });
  }

  private getTokens(html: string) {
    const iterator = Parser.parse(html, entities);
    const tagsList = ["default"];
    const attributesList: any = {};
    const parsedTokens = [];

    for (const t of iterator) {
      const token = t as any;
      const tagString = tagsList.join(".");

      switch (token.type) {
        case 'open': {
          tagsList.push(token.name);
          attributesList[tagString] = this.extractAttributes(token.attributes);
        }
        case 'text': {
          if (token.text) {
            const tags = tagString.split(".");
            const attributes = this.getAttributesFromTags(tags, attributesList);
            const style = this.mergeStyles(tags, attributesList);
            const text = token.text;

            const parsedToken = {
              text,
              attributes,
              tags,
              style,
              token
            };

            parsedTokens.push(parsedToken);
          }
        }
        case 'close': {
          if (token.type === "close") {
            tagsList.pop();
          }
        }
      }
    }

    return parsedTokens;
  }

  private getAttributesFromTags(tags: string[], attributes: any) {
    let result = {}
    let currentTags = [];

    tags.forEach((element) => {
      currentTags.push(element);
      const nestedTag = currentTags.join(".");
      const attribute = attributes[nestedTag];

      for (let key in attribute) {
        if (attribute[key]) {
          result[key] = attribute[key];
        }
      }
    });

    return result;
  }

  private mergeStyles(tags: string[], attributes: any) {
    let result = {}
    let currentTags = [];

    tags.forEach((element) => {
      currentTags.push(element);
      const nestedTag = currentTags.join(".");
      const styleFromTags = this._styles[element];
      const attribute = attributes[nestedTag];
      const styleFromAttributes = attribute?.style ? attribute?.style : {};

      for (let key in styleFromTags) {
        if (styleFromTags[key]) {
          result[key] = styleFromTags[key];
        }
      }

      for (let key in styleFromAttributes) {
        if (styleFromAttributes[key]) {
          result[key] = styleFromAttributes[key];
        }
      }
    });

    return result;
  }

  private getGlyphWith(font, style, glyph): number {
    return font.hmtx.aWidth[glyph] * style.fontSize / font.head.unitsPerEm;
  }

  private getTypeFromCharCode(charCode){
    let type = LeafType.Glyphs;
    
    switch (charCode) {
      case 160:   //" ":   // 160 // unbreakable space
      case 32:    //" ":   // space
        type = LeafType.Space;
        break;
      case 9:     //"\t":  // 9 // tabulation
        type = LeafType.Tabulation;
        break;
      case 8629:  //"↵":   // 8629 // chariet return
      case 13:    //"\r":  // 13 // return
      case 10:    //"\n":  // 10 // line break
        type = LeafType.NewLine;
        break;
      default:    // evrything else
        type = LeafType.Glyph;
        break;
    }

    return type;
  }

  public createLeaf(text: string, leaves: Leaf[], font: any, token, previousLeaf) {
    let type: LeafType;
    let charCode = text.charCodeAt(0);
    type = this.getTypeFromCharCode(charCode);

    let leaf = new Leaf({
      text,
      leaves,
      attributes: token?.attributes,
      tags: token?.tags,
      style: token?.style,
      font,
      previousLeaf,
      nextLeaf: null,
      type,
      glyph: null,
      path: null,
      pairAdjustment: null,
      width: 0,
      charCode,
      ascender: previousLeaf ? previousLeaf.ascender : 0,
      x: previousLeaf ? previousLeaf.x + previousLeaf.width : 0,
      y: 0,
    });

    if (leaves.length > 0) {
      const parentLeaf = leaf;
      
      const firstChild = leaves[0];
      const lastChild = leaves[leaves.length - 1];

      parentLeaf.hasChildren = true;
      firstChild.isFirst = true;
      lastChild.isLast = true;
      // const nextLeaf = parentLeaf.nextLeaf;
      
      // parentLeaf.nextLeaf = firstChild;
      // firstChild.previousLeaf = parentLeaf;
      // lastChild.nextLeaf = nextLeaf;

      parentLeaf.path = {
        cmds: [],
        crds: []
      };
      parentLeaf.type = LeafType.Glyphs;
      parentLeaf.charCode = null;
      leaves.forEach((child) => {
        //child.parentLeaf = parentLeaf;
        child.setParentLeaf(parentLeaf);
        parentLeaf.width += child.width;
        parentLeaf.ascender = Math.max(parentLeaf.ascender, child.ascender);
        parentLeaf.path.cmds.push(...child.path.cmds);
        parentLeaf.path.crds.push(...child.path.crds);
      });
    } else {
      const scale = 1 / leaf.font.head.unitsPerEm;
      leaf.glyph = typr.U.codeToGlyph(font, leaf.charCode);
      leaf.path = typr.U.glyphToPath(font, leaf.glyph);
      leaf.pairAdjustment = (previousLeaf?.glyph && leaf.glyph) ? typr.U.getPairAdjustment(font, previousLeaf.glyph, leaf.glyph) : 0;
      leaf.width = text !== "" ? this.getGlyphWith(font, token.style, leaf.glyph) : 0;
      leaf.ascender = Math.max(leaf.ascender, leaf.font.hhea.ascender);
    }

    return leaf;
  }

  private createLeaves(text: string, token, previousLeaf) {
    let leaf;
    const font = FontLibrary.getTyprFontFromStyle(token.style);

    if (text.length > 1) {
      const leaves = [];
      const letters = text.split("");
      let previousSubLeaf = previousLeaf;
      let currentSubLeaf = null;

      letters.forEach((letter) => {
        currentSubLeaf = this.createLeaf(letter, [], font, token, previousSubLeaf);
        previousSubLeaf = currentSubLeaf;
        leaves.push(currentSubLeaf);
      });

      leaf = this.createLeaf(text, leaves, font, token, previousLeaf);
    } else {
      leaf = this.createLeaf(text, [], font, token, previousLeaf);
    }

    previousLeaf = leaf;
    return leaf;
  }

  private tokenToleaves(parsed) {
    let previousLeaf;
    let currentLeaf: Leaf;
    const leaves = [];
    let text = "";

    parsed.forEach((token) => {
      currentLeaf = this.createLeaves(token.text, token, previousLeaf);
      leaves.push(currentLeaf);
      text += token.text;
      previousLeaf = currentLeaf;
    });

    const result = this.createLeaf(text, leaves, null, null, null);
    currentLeaf = result.lastChild();

    // rewind to update previous leaves
    while (currentLeaf) {
      const previousLeaf = currentLeaf.previous();
      const currentAscender = currentLeaf.ascender;

      if(previousLeaf){
        previousLeaf.setNextLeaf(currentLeaf);
        if(previousLeaf.type !== LeafType.NewLine){
          previousLeaf.ascender = currentAscender;
        }
      }
      
      currentLeaf = previousLeaf;
    }

    return result;
  }

  pathToContext(path, ctx, scale, x, y) {
    var c = 0, crds = path.crds;

    for (var j = 0; j < path.cmds.length; j++) {
      var cmd = path.cmds[j];
      if (cmd == "M") {
        ctx.moveTo(crds[c] * scale + x, crds[c + 1] * -scale + y);
        c += 2;
      }
      else if (cmd == "L") {
        ctx.lineTo(crds[c] * scale + x, crds[c + 1] * -scale + y);
        c += 2;
      }
      else if (cmd == "C") {
        ctx.bezierCurveTo(crds[c] * scale + x, crds[c + 1] * -scale + y, crds[c + 2] * scale + x, crds[c + 3] * -scale + y, crds[c + 4] * scale + x, crds[c + 5] * -scale + y);
        c += 6;
      }
      else if (cmd == "Q") {
        ctx.quadraticCurveTo(crds[c] * scale + x, crds[c + 1] * -scale + y, crds[c + 2] * scale + x, crds[c + 3] * -scale + y);
        c += 4;
      }
      else if (cmd == "Z") ctx.closePath();
    }
  }

  private tempDraw(leaf: Leaf, context) {
    if (leaf.type === LeafType.Glyph) {
      const path = leaf.path;
      const scale = leaf.style.fontSize * window.devicePixelRatio / leaf.font.head.unitsPerEm;
      const previous = leaf.previous();
      // context.translate((previous ? previous.width : 0) * scale, leaf.font.hhea.ascender * scale);
      // console.log(leaf.style.fontSize, window.devicePixelRatio, leaf.font.head.unitsPerEm, scale, leaf.x, leaf.ascender)

      context.beginPath();

      this.pathToContext(path, context, scale, leaf.x, leaf.ascender * scale);

      // context.translate(0, -leaf.font.hhea.ascender * scale);
      context.fillStyle = leaf.style.color;
      // context.fillStyle = "#ff0000";
      context.fill();
      // context.scale(1 / scale, -1 / scale);
    }
  }

  public parse(text: string) {
    const parsed = this.getTokens(text);
    const root = this.tokenToleaves(parsed);

    console.log(root);

    let currentLeaf = root.next();

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const context = canvas.getContext("2d");
    document.body.appendChild(canvas);

    // const scale = 30 * window.devicePixelRatio / 2048;
    // context.scale(scale, -scale);

    while (currentLeaf) {
      // console.log(currentLeaf);
      if (currentLeaf.leaves.length > 0) {
        currentLeaf.leaves.forEach(leaf => {
          this.tempDraw(leaf, context);
        })
      } else {
        this.tempDraw(currentLeaf, context);
      }
      currentLeaf = currentLeaf.next();
    }

    // context.scale(1 / scale, -1 / scale);



    window[`typr`] = typr;

    const itr = this.tokenizer.tokenize(text);
    const styles = [];
    const attributes: TokenAttributes[] = [];
    const tokens = [];
    const leaves = [];
    const tags = [];
    let tagLevel = -1;
    let tokenAttributes;
    let tokenStyle;
    let font;

    for (const token of itr) {
      switch (token.type) {
        case tokenTypes.OPENING_TAG:
          tags.push(token.name);
          styles.push(this._styles[token.name]);
          attributes.push(new TokenAttributes());
          tagLevel++;
          break;
        case tokenTypes.ATTRIBUTE:
          attributes[tagLevel].push(new TokenAttribute(token));
          if (token.name === "style") {
            styles.push(this.extractCustumStyle(token.value));
          }
          if (token.name === "class") {
            styles.push(this._styles[token.value]);
          }
          break;
        case tokenTypes.CLOSING_TAG:
          token.name = tags[tags.length - 1];

          if (token.name === "img") {
            tokenAttributes = this.mergeAttributesLists(attributes);

            tokenStyle = Utils.assign(styles, this._styles.default);

            font = FontLibrary.getFontFromStyle(tokenStyle);

            tokenStyle[`font`] = font;

            token[`tag`] = token.name;
            token[`style`] = tokenStyle;
            token[`attributes`] = tokenAttributes;
            token[`glyphs`] = [];

            console.log(Object.assign({}, token));

            const leaf = new LeafBackup("", token, this.renderer);
            leaf.previous =
              leaves.length > 0 ? leaves[leaves.length - 1] : null;
            leaves.push(leaf);
          }

          tags.pop();
          styles.pop();
          attributes.pop();
          tagLevel--;
          break;
        case tokenTypes.TEXT:
          tokenAttributes = this.mergeAttributesLists(attributes);
          tokenStyle = Utils.assign(styles, this._styles.default);

          font = FontLibrary.getFontFromStyle(tokenStyle);
          token.name = tags[tags.length - 1];

          tokenStyle[`font`] = font;
          token[`tag`] = token.name;
          token[`style`] = tokenStyle;
          token[`attributes`] = tokenAttributes;
          token[`glyphs`] = [];

          const reg = /(\s+)/g;

          token.text.split(reg).forEach(match => {
            if (match !== "") {
              leaves.length > 0 ? leaves[leaves.length - 1] : null;
              const leaf = new LeafBackup(match, token, this.renderer);
              leaf.previous =
                leaves.length > 0
                  ? leaves[leaves.length - 1]
                  : null;
              leaves.push(leaf);
            }
          });

          delete token.type;
          break;
      }
    }

    this.composeLines(leaves);
  }

  private composeLines(leaves: LeafBackup[]) {
    this.previousLeaf = null;
    this.root = new LeafBackup("", null, this.renderer, null, this.previousLeaf);
    this.leaves = leaves;
    let lastX: number = 0;
    let lastY: number = 0;
    let maxHeight: number = 0;
    let maxWidth: number = 0;

    let currentLine: LeafBackup[] = [];
    leaves.forEach((leaf) => {
      if (lastY === 0) {
        lastY = leaf.baseLine;
        maxHeight = leaf.baseLine;
      }

      leaf.y = lastY;

      switch (leaf.type) {
        case LeafType.NewLine:
          lastX = 0;
          lastY += maxHeight;
          maxHeight = 0;
          currentLine.push(leaf);
          this.createLine(currentLine);
          currentLine = [];
          break;
        case LeafType.Tabulation:
        case LeafType.Space:
          leaf.x = lastX;
          leaf.y = lastY;
          lastX += leaf.width + leaf.letterSpacing;
          currentLine.push(leaf);
          break;
        case LeafType.Glyph:
        case LeafType.Glyphs:
        case LeafType.Image:
          if (this.wordWrap && this.wordWrap > 0) {
            if (lastX + leaf.width > this.wordWrap) {
              lastX = 0;
              lastY += maxHeight;
              maxHeight = 0;
              this.createLine(currentLine);
              currentLine = [];
            }
          }

          currentLine.push(leaf);
          leaf.x = lastX;
          leaf.y = lastY + leaf.lineHeight;
          // leaf.y = ((lastY + leaf.lineHeight) - leaf.height) * .5;
          leaf.getPath();
          lastX += leaf.width;
          maxHeight = Math.max(maxHeight, leaf.height + leaf.lineHeight);
          maxWidth = Math.max(maxWidth, lastX);
          break;
      }
    });

    this.createLine(currentLine);

    this.width = Math.max(maxWidth, lastX);
    this.height = lastY;

    this.NotifyObservers();
  }

  private previousLeaf: LeafBackup = null;
  private currentLeaf: LeafBackup = null;
  private root: LeafBackup;

  private createLine(currentLine: LeafBackup[]) {
    const fullText = currentLine.map((leaf) => leaf.text).join("");
    this.previousLeaf = this.currentLeaf;
    this.currentLeaf = new LeafBackup(fullText, null, this.renderer, this.root, this.previousLeaf);
    this.root.children.push(this.currentLeaf);
    this.currentLeaf.children = currentLine;
  }

  private mergeAttributesLists(all: TokenAttributes[]) {
    const to = new TokenAttributes();
    for (let i = 0; i < all.length; i++) {
      all[i].attributes.forEach(attribute => {
        to.push(attribute);
      });
    }
    return to;
  }

  private extractCustumStyle(value: any) {
    let style = {};
    if (value && typeof value === "string") {
      const styleString = value.replace(/ /g, "").split(";");


      styleString.forEach(str => {
        const styleArray = str.split(":");
        style[styleArray[0]] = styleArray[1];
      });
      return style;
    }
    return value
  }

  private extractAttributes(attributes: any): any {
    const results = {};
    for (let key in attributes) {
      results[key] = this.extractAttribute(attributes[key]);
    }
    return results;
  }

  private extractAttribute(value: string): any {
    let style = {};

    if (value && value.indexOf(";") > -1) {
      const styleString = value.replace(/ /g, "").split(";");

      styleString.forEach((str) => {
        const styleArray = str.split(":");
        if (styleArray.length === 2) {
          style[styleArray[0]] = styleArray[1];
        }
      });

      return style;
    }

    return value
  }
}

export class TokenAttributes {
  public attributes: TokenAttribute[] = [];

  public push(attribute: TokenAttribute) {
    this.attributes.push(attribute);
  }

  public pop() {
    return this.attributes.pop();
  }

  public getByName(name: string) {
    return this.attributes.find((attribute: TokenAttribute) => {
      return attribute.name === name;
    });
  }
}

export class TokenAttribute {
  public name: string;
  public value: string;

  constructor(token) {
    this.name = token.name;
    this.value = token.value;
  }

  public get asInteger(): number {
    return parseInt(this.value);
  }

  public get asFloat() {
    return parseFloat(this.value);
  }
}
