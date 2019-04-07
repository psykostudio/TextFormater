import { Glyph, Font, Path } from "opentype.js";

export enum LeafType {
  Space = "Space",
  NewLine = "NewLine",
  Tabulation = "Tabulation",
  Word = "Word",
  Glyph = "Glyph"
}

export class Leaf {
  raw: string;
  token;
  children: Leaf[] = [];
  glyph: Glyph;
  style;
  font;
  fontSize: number;
  fontRatio: number;
  x: number = 0;
  y: number = 0;
  width: number;
  height: number = 0;
  type: LeafType;
  renderer;

  previous: Leaf = null;
  parent: Leaf;

  constructor(raw: string, token, renderer, parent?: Leaf, previous?: Leaf) {
    this.raw = raw;
    this.token = token;
    this.style = this.token[`style`];
    this.font = this.style.font;
    this.renderer = renderer;
    this.parent = parent;
    this.previous = previous;
    this.fontSize = Math.round(this.style.fontSize);
    this.fontRatio = (1 / this.font.unitsPerEm) * this.fontSize;

    if(!this.previous && this.parent){
      this.previous = this.parent.previous;
    }

    if(this.parent){
      this.y = this.parent.y;
    }else{
      this.y = this.font.ascender * this.fontRatio;
    }


    this.getType(raw);
  }

  private getType(raw: string) {
    if (raw.length > 1) {
      this.type = LeafType.Word;
      this.splitInGlyphs();
      console.log(this);
    } else {
      switch (raw) {
        case " ":
          this.type = LeafType.Space;
          console.log(this);
          break;
        case "\t":
          this.type = LeafType.Tabulation;
          console.log(this);
          break;
        case "\r":
        case "\n":
          this.type = LeafType.NewLine;
          console.log(this);
          break;
        default:
          this.type = LeafType.Glyph;
          break;
      }
      this.buildGlyph();
    }
  }

  public draw(context: CanvasRenderingContext2D) {
    if (this.type !== LeafType.Glyph) {
      this.children.forEach(child => {
        child.draw(context);
      });
    } else {
      const path = this.getPath();
      path[`fill`] = this.style.color;
      path.draw(context);
    }
  }

  private getPath() {
    const x = this.parent ? this.parent.x + this.x : this.x;

    return (this.glyph as any).getPath(
      x,
      this.y,
      this.fontSize,
      this.renderer.renderOptions,
      this.font
    );
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
    const yDiff = this.glyph[`yMax`] - this.glyph[`yMin`];
    const height = isNaN(yDiff) ? 0 : yDiff * this.fontRatio;

    return { width, height };
  }

  private buildGlyph() {
    this.glyph = this.font.charToGlyph(this.raw);
    const bounds = this.getGlyphBound();

    this.width = bounds.width;
    this.height = bounds.height;
    this.type = LeafType.Glyph;
  }

  private splitInGlyphs() {
    const chars = this.raw.split("");
    let totalWidth: number = 0;

    chars.forEach((char: string, index: number) => {
      const previous = this.children[index - 1];
      const child = new Leaf(char, this.token, this.renderer, this, previous);
      child.parent = this;
      child.x = totalWidth;
      this.children.push(child);
      totalWidth += child.width;
      this.height = Math.max(this.height, child.height);
    });

    this.width = totalWidth;
  }
}
