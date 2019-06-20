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
export interface PaddingRectangle {
    top: number;
    left: number;
    right: number;
    bottom: number;
}
export declare type RenderingContext = CanvasRenderingContext2D | WebGLRenderingContext;
export interface TextRenderer {
    resolution: number;
    renderOptions: RenderOptions;
    clear(width: number, height: number): any;
    update(context: RenderingContext): any;
}
export declare class CanvasTextRenderer implements TextRenderer, IObservable {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    formater: Formater;
    private debug;
    private _currentStyle;
    private _observers;
    resolution: number;
    renderOptions: RenderOptions;
    padding: PaddingRectangle;
    constructor();
    RegisterObserver(observer: IObserver): void;
    RemoveObserver(observer: IObserver): void;
    NotifyObservers(): void;
    nearestUpperPowerOfTwo(x: number): number;
    clear(width?: number, height?: number): void;
    private renderingPasses;
    update(context: RenderingContext): void;
    private resetRenderPass(context);
    private debugRenderingPass(context, leaf);
    private shadowRenderPass(context, leaf);
    private strokeRenderPass(context, leaf);
    private fillRenderPass(context, leaf);
    private imagesRenderPass(context, leaf);
}
