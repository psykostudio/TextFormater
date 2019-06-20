import { Formater } from "./index";
import { CanvasTextRenderer } from "./renderer";
import { FontStyle, FontStyles } from "./libraries/fontlibrary";
import { IObserver } from "./interfaces/IObserver";
export declare class Layout implements IObserver {
    formater: Formater;
    renderer: CanvasTextRenderer;
    private _text;
    constructor();
    setStyles(styles: FontStyle | FontStyles): void;
    text: string;
    ReceiveNotification<T>(datas: T): void;
}
