import { Token } from "./formater";
import { Glyph, Font, Path } from "opentype.js";
import { defaultEntityMap } from "./tokenizer";
import { Leaf, LeafType } from "./Leaf";

export class CanvasTextRenderer {
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  private debug: HTMLDivElement;
  private _currentStyle;
  public renderOptions = {
    hinting: true,
    kerning: true,
    features: {
      liga: true,
      rlig: true
    },
    letterSpacing: 100
  };

  public clear() {
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.debug = document.createElement("div");
    this.debug.appendChild(this.canvas);
    document.body.appendChild(this.debug);
  }

  public update(leafs: Leaf[]) {
    let lastX: number = 0;
    let lastY: number = 0;
    let maxHeight: number = 0;

    leafs.forEach(leaf => {
      // new style
      const fontColor: string = leaf.style.color;

      if (lastY === 0) {
        lastY = leaf.font.ascender * leaf.fontRatio;
      }

      this.context.fillStyle = fontColor;

      leaf.x = lastX;
      // leaf.y = lastY;

      switch (leaf.type) {
        case LeafType.NewLine:
          lastY += maxHeight;
          maxHeight = 0;
          lastX = 0;
          break;
        case LeafType.Space:
          //leaf.y = lastY;
          leaf.draw(this.context);
          lastX += leaf.width;
          break;
        case LeafType.Word:
          //leaf.y = lastY;
          leaf.draw(this.context);
          maxHeight = Math.max(maxHeight, leaf.height);
          lastX += leaf.width;
          break;
      }

      this.currentStyle = leaf.style;
    });
  }

  private set currentStyle(style) {
    this._currentStyle = style;
    if (this._currentStyle.fillStyle) {
      this.context.fillStyle = this._currentStyle.fillStyle;
      this.context.fill();
    }

    if (this._currentStyle.stroke) {
      this.context.strokeStyle = this._currentStyle.stroke;
      this.context.lineWidth = this._currentStyle.strokeWidth;
      this.context.stroke();
    }
  }
}
