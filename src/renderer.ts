import { Token } from "./formater";
import { Glyph, Font, Path } from "opentype.js";
import { defaultEntityMap } from "./tokenizer";

export class CanvasTextRenderer {
  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  private debug: HTMLDivElement;
  private _currentStyle;

  public clear() {
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.debug = document.createElement("div");
    this.debug.appendChild(this.canvas);
    document.body.appendChild(this.debug);
  }

  public update(tokens: Token[]) {
    let lastX: number = 0;
    let lastY: number = 0;

    tokens.forEach(token => {
      // new style
      const font: Font = token.style.font;
      console.log(token, font);
      const fontSize: number = token.style.fontSize * 2;
      const fontRatio = (1 / font.unitsPerEm) * fontSize;
      const fontColor: string = token.style.color;

      if (lastY === 0) {
        lastY = font.ascender * fontRatio;
      }

      this.context.fillStyle = fontColor;

      token.glyphs.forEach(glyph => {
        if (glyph.unicode === undefined) {
          // new line
          lastY += 100;
          lastX = 0;
        } else {
          // new glyph
          const path = glyph.getPath(lastX, lastY, fontSize);
          path[`fill`] = fontColor;
          lastX += glyph.advanceWidth * fontRatio;

          // const svg = path.toSVG(2);
          // this.canvas.innerHTML += svg;

          path.draw(this.context);
          // this.drawPath(path);
        }
      });

      this.currentStyle = token.style;
    });

    console.log(tokens);
  }

  private drawPath(path: Path) {
    this.context.beginPath();
    for (let i = 0; i < path.commands.length; i += 1) {
      const cmd = path.commands[i];
      if (cmd.type === "M") {
        this.context.moveTo(cmd.x, cmd.y);
      } else if (cmd.type === "L") {
        this.context.lineTo(cmd.x, cmd.y);
      } else if (cmd.type === "C") {
        this.context.bezierCurveTo(
          cmd.x1,
          cmd.y1,
          cmd.x2,
          cmd.y2,
          cmd.x,
          cmd.y
        );
      } else if (cmd.type === "Q") {
        this.context.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
      } else if (cmd.type === "Z") {
        this.context.closePath();
      }
    }
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
