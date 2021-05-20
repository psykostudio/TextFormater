import { Glyph, Font, Path } from "opentype.js";
import { TokenAttribute, TokenAttributes } from "./formater";
import { TextRenderer } from "./renderers/renderer";
import { FontStyle } from "./libraries/fontlibrary";
import { ImageLibrary } from "./libraries/imageslibrary";
import { Utils } from "./libraries/utils";

export enum LeafType {
  Root = "Root",
  Space = "Space",
  NewLine = "NewLine",
  Tabulation = "Tabulation",
  Glyphs = "Glyphs",
  Glyph = "Glyph",
  Image = "Image"
}


export class Leaf {
  text: string;
  leaves: Leaf[];
  attributes: any;
  tags: any;
  style: any;
  font: any;
  protected previousLeaf: Leaf;
  protected nextLeaf: Leaf;
  protected parentLeaf: Leaf;
  public isFirst?: boolean;
  public isLast?: boolean;
  public hasChildren?: boolean;
  type: LeafType;
  glyph: number;
  path: any;
  pairAdjustment: number;
  x: number;
  y: number;
  width: number;
  charCode: number;
  ascender: number;

  public constructor(datas) {
    for (let key in datas) {
      this[key] = datas[key];
    }
  }

  public setParentLeaf(parentLeaf: Leaf) {
    this.parentLeaf = parentLeaf;
  }

  public setNextLeaf(nextLeaf: Leaf) {
    this.nextLeaf = nextLeaf;
  }

  public next(): Leaf {
    return this.hasChildren ? this.leaves[0] : this.nextLeaf;
    // if (this.isFirst && this.leaves.length > 0) return this.leaves[0];
    // if (this.isLast && this.parentLeaf) return this.parentLeaf.nextLeaf;
    // return this.nextLeaf;
  }

  public previous(): Leaf {
    return this.previousLeaf ? this.previousLeaf.lastChild() : null;
    // if (this.isFirst && this.previousLeaf) return this.previousLeaf.lastChild();
    // return this.previousLeaf;
  }

  public firstChild(): Leaf {
    return this.hasChildren ? this.leaves[0] : this;
  }

  public lastChild(): Leaf {
    return this.hasChildren ? this.leaves[this.leaves.length - 1] : this;
  }
}

export class LeafBackup {
  public text: string;
  public token;
  public children: LeafBackup[] = [];
  public glyph: Glyph;
  public style: FontStyle;
  public font: Font;
  public fontSize: number;
  public fontRatio: number;
  private _x: number = 0;
  private _y: number = 0;
  public width: number;
  public height: number = 0;
  public type: LeafType;
  public path: Path;
  public attributes: TokenAttributes;
  public image: HTMLImageElement;
  public baseLine: number;
  public lineHeight: number;
  public letterSpacing: number;
  renderer: TextRenderer;

  private _previous: LeafBackup = null;
  private _next: LeafBackup = null;
  private _parent: LeafBackup;

  constructor(text: string, token, renderer: TextRenderer, parent?: LeafBackup, previous?: LeafBackup) {
    this.text = text;
    this.token = token;
    this.renderer = renderer;
    this.parent = parent;
    this.previous = previous;

    if (this.token) {
      this.style = this.token[`style`];
      this.attributes = this.token[`attributes`];
      this.letterSpacing = this.style.letterSpacing || 0;

      this.font = this.style.font;

      const unitsPerEm = this.font?.unitsPerEm ? this.font.unitsPerEm : 1;
      const ascender = this.font?.ascender ? this.font.ascender : 0;

      const styleFontSize = this.style.fontSize || 12;
      this.fontSize = Math.round(styleFontSize);
      this.fontRatio = (1 / unitsPerEm) * this.fontSize;
      this.baseLine = ascender * this.fontRatio;
      this.lineHeight = this.style.lineHeight ? this.style.lineHeight : 0;

      this.identify();
    }
  }

  private identify() {
    if (this.text.length > 1) {
      this.type = LeafType.Glyphs;
      this.splitInGlyphs();
    } else {
      if (this.token.name === "img") {
        this.type = LeafType.Image;

        const imgSrc = this.attributes.getByName("src").value;
        this.image = ImageLibrary.getImage(imgSrc);
        this.getSize();
      } else {
        switch (this.text) {
          case " ":
            this.type = LeafType.Space;
            break;
          case "\t":
            this.type = LeafType.Tabulation;
            break;
          case "↵":
          case "\r":
          case "\n":
            this.type = LeafType.NewLine;
            break;
          default:
            if (this.text.length === 1) {
              this.type = LeafType.Glyph;
            }
            break;
        }

        this.buildGlyph();
      }
    }
  }

  private getSize() {
    if (this.style.width) { this.width = Utils.extractNumber(this.style.width, this.image.width); }
    if (this.style.height) { this.height = Utils.extractNumber(this.style.height, this.image.height); }

    const widthAttribute: TokenAttribute = this.attributes.getByName("width");
    const heightAttribute: TokenAttribute = this.attributes.getByName("height");

    if (widthAttribute) { this.width = widthAttribute.asInteger; }
    if (heightAttribute) { this.height = heightAttribute.asInteger; }
  }

  public drawImage(context: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
    const drawPosition = {
      x: Math.round(this.x + offsetX),
      y: Math.round(this.y - this.baseLine + offsetY),
    }

    if (!this.image) {
      const imgSrc = this.attributes.getByName("src").value;
      ImageLibrary.loadImage({ url: imgSrc }).then(() => {
        this.image = ImageLibrary.getImage(imgSrc);
        this.image.width = this.width;
        this.image.height = this.height;
        context.drawImage(
          this.image,
          drawPosition.x,
          drawPosition.y,
          this.width,
          this.height
        );
      });
    } else {
      this.image.width = this.width;
      this.image.height = this.height;
      context.drawImage(
        this.image,
        drawPosition.x,
        drawPosition.y,
        this.width,
        this.height
      );
    }
  }

  private loadImage(cb: () => void) {
    this.image = new Image();
    this.image.src = this.attributes.getByName("src").value;
    this.image.onload = cb;
  }

  public contains(point: { x: number, y: number }) {
    const roundedBounds = {
      x: Math.round(this.x),
      y: Math.round(this.y - this.baseLine),
      width: Math.round(this.width),
      height: Math.round(this.height),
    }

    if (point.x < roundedBounds.x) return false;
    if (point.x > roundedBounds.x + roundedBounds.width) return false;
    if (point.y < roundedBounds.y) return false;
    if (point.y > roundedBounds.y + roundedBounds.height) return false;

    return true;
  }

  public getPath(): Path {
    if (this.children.length > 0) {
      this.path = new Path();
      this.children.forEach((child) => {
        if (child) {
          this.path.extend(child.getPath());
        }
      });
    } else if (this.type !== LeafType.Image) {
      if (this.glyph) {
        this.path = this.glyph.getPath(
          this.roundedPosition.x,
          this.roundedPosition.y,
          this.fontSize,
          this.renderer.renderOptions,
          this.font
        );
      }
    }

    return this.path;
  }

  public get roundedPosition() {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
    }
  }

  private getGlyphBound() {
    if (
      this.renderer.renderOptions.kerning &&
      this.previous &&
      this.previous.glyph
    ) {
      const kerning = this.font.getKerningValue(
        this.previous.glyph,
        this.glyph
      );
      this.previous.glyph.advanceWidth += kerning;
    }

    const width = this.glyph.advanceWidth * this.fontRatio;
    const yDiff = this.glyph[`yMax`] ? (this.glyph[`yMax`] - this.glyph[`yMin`]) * this.fontRatio : this.fontSize;
    const height = isNaN(yDiff) ? 0 : yDiff;
    return { width, height };
  }

  private buildGlyph() {
    if (this.font) {
      this.glyph = this.font.charToGlyph(this.text);
      const bounds = this.getGlyphBound();
      this.width = bounds.width;
      this.height = bounds.height;
    }
  }

  private splitInGlyphs() {
    const chars = this.text.split("");
    let totalWidth: number = 0;

    chars.forEach((char: string, index: number) => {
      const child = new LeafBackup(char, this.token, this.renderer);
      child.previous = this.children[index - 1];
      child.parent = this;
      child.x = totalWidth;
      totalWidth += child.width + this.letterSpacing;
      this.height = Math.max(this.height, child.height);
      this.addChild(child);
    });

    this.width = totalWidth;
  }

  public addChild(childs: LeafBackup | LeafBackup[]) {
    if (Array.isArray(childs)) {
      childs.forEach(child => {
        this.addChild(child);
      });
    } else {
      this.children.push(childs);
    }
  }

  public set parent(value: LeafBackup) {
    this._parent = value;

    if (!this.previous && this.parent) {
      this.previous = this.parent.previous;
    }
  }

  public get parent() {
    return this._parent;
  }

  public set previous(value: LeafBackup) {
    this._previous = value;

    if (this._previous) {
      this._previous.next = this;
    }
  }

  public get previous() {
    return this._previous;
  }

  public set next(value: LeafBackup) {
    this._next = value;
  }

  public get next() {
    return this._next;
  }

  public set x(value: number) {
    this._x = value;
  }

  public get x() {
    return this._x + (this.parent ? this.parent.x : 0);
  }

  public set y(value: number) {
    this._y = value;
  }

  public get y() {
    return this._y + (this.parent ? this.parent.y : 0);
  }
}
