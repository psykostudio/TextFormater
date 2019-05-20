
import { Leaf, LeafType } from "./leaf";
import { IObserver } from "./interfaces/IObserver";
import { IObservable } from "./interfaces/IObservable";
import { Formater } from "./formater";

export interface RenderOptions {
  hinting: boolean;
  kerning: boolean;
  features: {
    liga: boolean;
    rlig: boolean;
  };
  letterSpacing: number;
}

export interface PaddingRectangle{
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export type RenderingContext = CanvasRenderingContext2D | WebGLRenderingContext;

export interface TextRenderer {
  resolution: number;
  renderOptions: RenderOptions;
  clear(width: number, height: number);
  update(context: RenderingContext);
}

export class CanvasTextRenderer implements TextRenderer, IObservable {
  public canvas: HTMLCanvasElement = document.createElement("canvas");
  public context: CanvasRenderingContext2D = this.canvas.getContext("2d");
  public formater: Formater;
  private debug: HTMLDivElement;
  private _currentStyle;

  private _observers: IObserver[] = [];

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

  public padding: PaddingRectangle = { top: 0, left: 0, right: 0, bottom: 0 };

  public constructor() {
    this.debug = document.getElementById("DEBUG") as HTMLDivElement;
    if (!this.debug) {
      this.debug = document.createElement("div");
      this.debug.id = "DEBUG";
      document.body.appendChild(this.debug);
    }
  }
  
  public RegisterObserver(observer: IObserver){
    this._observers.push(observer);
  }

  public RemoveObserver(observer: IObserver){
    this._observers.forEach((registered, index) => {
      if(registered === observer){
        this._observers.splice(index, 1);
      }
    });
  }

  public NotifyObservers(){
    this._observers.forEach((observer) => {
      observer.ReceiveNotification("UPDATE");
    });
  }

  public nearestUpperPowerOfTwo(x: number) {
    let power = 1;
    while (power < x) power *= 2;
    return power;
  }

  public clear(width?: number, height?: number) {
    this.canvas.width = this.nearestUpperPowerOfTwo(width || this.canvas.width);
    this.canvas.height = this.nearestUpperPowerOfTwo(height || this.canvas.height);
    
    this.debug.appendChild(this.canvas);
  }

  private renderingPasses = [
    // this.debugRenderingPass,
    this.imagesRenderPass,
    this.shadowRenderPass,
    this.strokeRenderPass,
    this.fillRenderPass
  ];

  public update(context: RenderingContext) {
    this.renderingPasses.forEach(renderPass => {
      this.resetRenderPass(context);
      this.formater.leaves.forEach(leaf => {
        switch (leaf.type) {
          case LeafType.Glyph:
          case LeafType.Word:
            if (renderPass !== this.imagesRenderPass) {
              renderPass.call(this, context, leaf);
            }
            break;
          case LeafType.Image:
            if (renderPass === this.imagesRenderPass) {
              renderPass.call(this, context, leaf);
            }
            break;
        }
      });
    });

    this.NotifyObservers();
  }

  private resetRenderPass(context) {
    context.fillStyle = null;
    context.shadowColor = null;
    context.strokeStyle = null;
    context.lineWidth = 0;
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  private debugRenderingPass(context, leaf: Leaf) {
    const pos = leaf.roundedPosition;
    context.rect(pos.x + this.padding.left, pos.y - leaf.baseLine + this.padding.top, leaf.width, leaf.height);

    context.strokeStyle = leaf.style.stroke;
    context.lineWidth = leaf.style.strokeWidth * 2;
    context.stroke();
  }

  private shadowRenderPass(context, leaf: Leaf) {
    if (leaf.style.shadowColor && leaf.style.shadowBlur) {
      leaf.draw(context, this.padding.left, this.padding.top);

      context.shadowColor = leaf.style.shadowColor;
      context.shadowBlur = leaf.style.shadowBlur || 0;
      context.shadowOffsetX = leaf.style.shadowOffsetX || 0;
      context.shadowOffsetY = leaf.style.shadowOffsetY || 0;
      context.fillStyle = leaf.style.shadowColor;
      context.fill();
    }
  }

  private strokeRenderPass(context, leaf: Leaf) {
    if (leaf.style.stroke) {
      leaf.draw(context, this.padding.left, this.padding.top);

      context.strokeStyle = leaf.style.stroke;
      context.fillStyle = leaf.style.stroke;
      context.lineWidth = leaf.style.strokeWidth * 2;
      context.fill();
      context.stroke();
    }
  }

  private fillRenderPass(context, leaf: Leaf) {
    if (leaf.style.color) {
      leaf.draw(context, this.padding.left, this.padding.top);

      context.fillStyle = leaf.style.color;
      context.fill();
    }
  }

  private imagesRenderPass(context, leaf: Leaf) {
    leaf.drawImage(context, this.padding.left, this.padding.top);
  }
}
