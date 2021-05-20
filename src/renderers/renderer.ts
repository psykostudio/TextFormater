
import { LeafBackup, LeafType } from "../leaf";
import { IObserver } from "../interfaces/IObserver";
import { IObservable } from "../interfaces/IObservable";
import { Formater } from "../formater";
import { Utils } from "../libraries/utils";

export interface RenderOptions {
  hinting: boolean;
  kerning: boolean;
  features: {
    liga: boolean;
    rlig: boolean;
  };
  letterSpacing: number;
}

export interface PaddingRectangle {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export type RenderingContext = CanvasRenderingContext2D | WebGLRenderingContext;

export class TextRenderer implements IObservable {
  public canvas: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  public formater: Formater;

  private _currentStyle;
  private _observers: IObserver[] = [];

  public resolution: number = 1;
  public invertedResolution: number = 1;

  public renderOptions: RenderOptions = {
    hinting: true,
    kerning: true,
    features: {
      liga: true,
      rlig: true
    },
    letterSpacing: 100
  };

  protected _renderingPasses = [];

  public padding: PaddingRectangle = { top: 0, left: 0, right: 0, bottom: 0 };

  public constructor(canvas?: HTMLCanvasElement) {
    if (!canvas) {
      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d");
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

  public clear(width?: number, height?: number) {
    this.canvas.width = Utils.nearestUpperPowerOfTwo(width || this.canvas.width);
    this.canvas.height = Utils.nearestUpperPowerOfTwo(height || this.canvas.height);
  }

  public update(context?: CanvasRenderingContext2D) {
    const renderingContext = context ? context : this.context;

    this._renderingPasses.forEach((renderPass: IRenderPass) => {
      this.resetRenderPass(renderingContext);
      this.formater.leaves.forEach((leaf) => {
        switch (leaf.type) {
          case LeafType.Glyph:
          case LeafType.Glyphs:
            if (renderPass.type !== RenderPassTypes.ImageRenderPass) {
              renderPass.apply(this, leaf);
            }
            break;
          case LeafType.Image:
            if (renderPass.type === RenderPassTypes.ImageRenderPass) {
              renderPass.apply(this, leaf);
            }
            break;
        }
      });
    });

    this.NotifyObservers();
  }

  private resetRenderPass(context?: CanvasRenderingContext2D) {
    const renderingContext = context ? context : this.context;

    renderingContext.fillStyle = null;
    renderingContext.shadowColor = null;
    renderingContext.strokeStyle = null;
    renderingContext.lineWidth = 0;
    renderingContext.shadowBlur = 0;
    renderingContext.shadowOffsetX = 0;
    renderingContext.shadowOffsetY = 0;
  }
}

export enum RenderPassTypes {
  ImageRenderPass = "ImageRenderPass",
  FillRenderPass = "FillRenderPass",
  StrokeRenderPass = "StrokeRenderPass",
  ShadowRenderPass = "ShadowRenderPass",
  DebugRenderPass = "DebugRenderPass",
}

export interface IRenderPass {
  type: string;
  apply(renderer: TextRenderer, leaf: LeafBackup): void;
}
