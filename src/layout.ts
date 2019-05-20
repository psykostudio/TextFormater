import { Formater } from "./index";
import { TextRenderer, CanvasTextRenderer } from "./renderer";
import { FontLibrary, FontStyle, FontStyles } from "./libraries/fontlibrary";
import { IObserver } from "./interfaces/IObserver";

export class Layout implements IObserver {
  public formater: Formater = new Formater();
  public renderer: CanvasTextRenderer = new CanvasTextRenderer();
  private _text: string;

  constructor() {
    this.formater.RegisterObserver(this);
    this.renderer.formater = this.formater;
  }

  public setStyles(styles: FontStyle | FontStyles) {
    this.formater.setStyles(styles);
  }

  set text(value: string) {
    this._text = value;
    this.formater.parse(this._text);
  }

  get text(): string {
    return this._text;
  }

  ReceiveNotification<T>(datas: T): void {
    this.renderer.clear(this.formater.width, this.formater.height);
    this.renderer.update(this.renderer.context);
  }
}
