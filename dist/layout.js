import { Formater } from "./index";
import { CanvasTextRenderer } from "./renderer";
export class Layout {
    constructor() {
        this.formater = new Formater();
        this.renderer = new CanvasTextRenderer();
        this.formater.RegisterObserver(this);
        this.renderer.formater = this.formater;
    }
    setStyles(styles) {
        this.formater.setStyles(styles);
    }
    set text(value) {
        this._text = value;
        this.formater.parse(this._text);
    }
    get text() {
        return this._text;
    }
    ReceiveNotification(datas) {
        this.renderer.clear(this.formater.width, this.formater.height);
        this.renderer.update(this.renderer.context);
    }
}
//# sourceMappingURL=layout.js.map