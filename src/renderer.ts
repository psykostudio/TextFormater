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

  private renderingPasses = [
    this.shadowRenderPass,
    this.strokeRenderPass,
    this.fillRenderPass
  ];

  public update(leafs: Leaf[]) {
    this.renderingPasses.forEach(renderPass => {
      this.resetRenderPass();
      leafs.forEach(leaf => {
        switch (leaf.type) {
          case LeafType.Glyph:
          case LeafType.Word:
            renderPass.call(this, leaf);
            break;
        }
      });
    });
  }

  private resetRenderPass(){
    this.context.fillStyle = null;
    this.context.shadowColor = null;
    this.context.strokeStyle = null;
    this.context.lineWidth = 0;
    this.context.shadowBlur = 0;
    this.context.shadowOffsetX = 0;
    this.context.shadowOffsetY = 0;
  }

  private shadowRenderPass(leaf: Leaf) {
    if (leaf.style.shadowColor && leaf.style.shadowBlur) {
      leaf.draw(this.context);

      this.context.shadowColor = leaf.style.shadowColor;
      this.context.shadowBlur = leaf.style.shadowBlur || 0;
      this.context.shadowOffsetX = leaf.style.shadowOffsetX || 0;
      this.context.shadowOffsetY = leaf.style.shadowOffsetY || 0;
      this.context.fillStyle = leaf.style.shadowColor;
      this.context.fill();
    }
  }

  private strokeRenderPass(leaf: Leaf) {
    if (leaf.style.stroke) {
      leaf.draw(this.context);

      this.context.strokeStyle = leaf.style.stroke;
      this.context.fillStyle = leaf.style.stroke;
      this.context.lineWidth = leaf.style.strokeWidth * 2;
      this.context.fill();
      this.context.stroke();
    }
  }

  private fillRenderPass(leaf: Leaf) {
    if (leaf.style.color) {
      leaf.draw(this.context);

      this.context.fillStyle = leaf.style.color;
      this.context.fill();
    }
  }
}
