import { Token } from "./formater";
import { Glyph, Font, Path } from "opentype.js";
import { defaultEntityMap } from "./tokenizer";
import { Leaf, LeafType } from "./Leaf";

export interface RenderOptions {
  hinting: boolean;
  kerning: boolean;
  features: {
    liga: boolean;
    rlig: boolean;
  };
  letterSpacing: number;
}

export interface TextRenderer {
  resolution: number;
  renderOptions: RenderOptions;
  clear(width: number, height: number);
  update(leafs: Leaf[]);
}

export class CanvasTextRenderer implements TextRenderer {
  public canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  private debug: HTMLDivElement;
  private _currentStyle;

  public resolution: number = 1;
  public renderOptions: RenderOptions = {
    hinting: true,
    kerning: true,
    features: {
      liga: true,
      rlig: true
    },
    letterSpacing: 100
  };

  public constructor() {
    this.debug = document.getElementById("DEBUG") as HTMLDivElement;
    if (!this.debug) {
      this.debug = document.createElement("div");
      this.debug.id = "DEBUG";
      document.body.appendChild(this.debug);
    }
  }

  private nearestUpperPowerOfTwo(x: number) {
    let power = 1;
    while (power < x) power *= 2;
    return power;
  }

  public clear(width: number, height: number) {
    this.canvas.width = this.nearestUpperPowerOfTwo(width);
    this.canvas.height = this.nearestUpperPowerOfTwo(height);
    console.log(width, height, this.canvas.width, this.canvas.height);
    this.debug.appendChild(this.canvas);
  }

  private renderingPasses = [
    // this.debugRenderingPass,
    this.imagesRenderPass,
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
            if (renderPass !== this.imagesRenderPass) {
              renderPass.call(this, leaf);
            }
            break;
          case LeafType.Image:
            if (renderPass === this.imagesRenderPass) {
              renderPass.call(this, leaf);
            }
            break;
        }
      });
    });
  }

  private resetRenderPass() {
    this.context.fillStyle = null;
    this.context.shadowColor = null;
    this.context.strokeStyle = null;
    this.context.lineWidth = 0;
    this.context.shadowBlur = 0;
    this.context.shadowOffsetX = 0;
    this.context.shadowOffsetY = 0;
  }

  private debugRenderingPass(leaf: Leaf) {
    const pos = leaf.roundedPosition;
    this.context.rect(pos.x, pos.y - leaf.baseLine, leaf.width, leaf.height);

    this.context.strokeStyle = leaf.style.stroke;
    this.context.lineWidth = leaf.style.strokeWidth * 2;
    this.context.stroke();
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

  private imagesRenderPass(leaf: Leaf) {
    leaf.drawImage(this.context);
  }
}
