import { Formater } from "./index";
import { TextRenderer, CanvasTextRenderer } from "./renderer";
import { FontLibrary, FontStyle, FontStyles } from "./libraries/fontlibrary";
import { IObserver } from "./interfaces/IObserver";

export class Layout implements IObserver {
  public formater: Formater = new Formater();
  public renderer: CanvasTextRenderer = new CanvasTextRenderer();

  constructor() {
    this.formater.RegisterObserver(this);
  }

  public setStyles(styles: FontStyle | FontStyles) {
    this.formater.setStyles(styles);
  }

  set text( value: string ){
    this.formater.parse(value);
  }

  ReceiveNotification<T>(datas: T): void {
    this.renderer.clear(this.formater.width, this.formater.height);
    this.renderer.update(this.formater.leaves);
  }
}
