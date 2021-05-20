import { CanvasTextRenderer, FontLibrary, FontStyle, FontStyles, Formater, ImageLibrary, IObservable, IObserver } from "@psykostudio/textformater";

class TextField implements IObserver {
  private _formater: Formater;
  private _renderer: CanvasTextRenderer;

  public constructor() {
    this._formater = new Formater();
    this._renderer = CanvasTextRenderer.defaultRenderer();

    this._renderer.formater = this._formater;
    this._formater.RegisterObserver(this);

    document.body.appendChild(this._renderer.canvas);

    this._formater.wordWrap = 800;
    window.onresize = (e: Event) => this.onResize(e);
    this._formater.renderer.resolution = window.devicePixelRatio;
  }

  private onResize(e?: Event): void {
    this._renderer.resolution = window.devicePixelRatio;
    this._formater.renderer.resolution = window.devicePixelRatio;
    this.update();
  }

  public set styles(value: FontStyle | FontStyles) {
    this._formater.setStyles(value);
  }

  public set text(value: string) {
    this._formater.parse(value);
  }

  public update() {
    this._renderer.clear(this._formater.width, this._formater.height);
    this._renderer.update();
  }

  ReceiveNotification<T>(message: T): void {
    this.update();
  }
}

class Exemple1 {
  public constructor() {
    this.init();
  }

  async init(): Promise<void> {
    await this.loadFonts([
      { name: "DancingScript", path: "./assets/fonts/Dancing_Script/DancingScript-Regular.ttf" },
      { name: "DancingScript Bold", path: "./assets/fonts/Dancing_Script/DancingScript-Bold.ttf" },
      { name: "Fascinate Inline", path: "./assets/fonts/Fascinate_Inline/FascinateInline-Regular.ttf" },
      { name: "Lobster", path: "./assets/fonts/Lobster/Lobster-Regular.ttf" },
      { name: "Vegan Style", path: "./assets/fonts/Vegan Style.ttf" },
      { name: "Lemon Jelly", path: "./assets/fonts/Lemon Jelly.ttf" },
      { name: "Roboto Bold", path: "./assets/fonts/Roboto/Roboto-Bold.ttf" },
      { name: "Roboto Black", path: "./assets/fonts/Roboto/Roboto-Black.ttf" },
      { name: "Roboto Light", path: "./assets/fonts/Roboto/Roboto-Light.ttf" },
      { name: "Calibri", path: "./assets/fonts/calibri.ttf" },
      { name: "Calibri Bold", path: "./assets/fonts/calibrib.ttf" },
      { name: "Calibri Italic", path: "./assets/fonts/calibrii.ttf" },
      { name: "Calibri Light", path: "./assets/fonts/calibril.ttf" },
      { name: "Calibri Light Italic", path: "./assets/fonts/calibrili.ttf" },
      { name: "Calibri Bold Italic", path: "./assets/fonts/calibriz.ttf" },
      { name: "Verdana", path: "./assets/fonts/verdana.ttf" },
      { name: "Verdana Bold", path: "./assets/fonts/verdanab.ttf" },
      { name: "Verdana Italic", path: "./assets/fonts/verdanai.ttf" },
      { name: "Verdana Bold Italic", path: "./assets/fonts/verdanaz.ttf" }
    ]);

    await this.loadImages([
      { id: "logo_babylonjs", url: "./assets/images/1200px-Babylon_logo_v4.svg.png" },
      { id: "smiley_love", url: "./assets/images/smiley_love.svg" }
    ]);

    const textfield = new TextField();

    const google = `<google><cyan>G</cyan><red>o</red><yellow>o</yellow><cyan>g</cyan><green>l</green><red>e</red></google>`;
    const googleLink = `<a href="https://www.google.com">${google}</a>`;
    const pixiJS = `<pixi>Pixi<js>.js</js></pixi>`;
    const logoBaylonJS = `<img src="logo_babylonjs" width=60 height=60></img>`;
    const babylonjs = `${logoBaylonJS}<balylon>Babylon<js>.js</js></balylon>`;
    const smiley = `<img class="smiley" src="smiley_love"></img>`;
    const dance = `<dancing>Dancing</dancing>`;
    const babylonJSGreetings = `${babylonjs}<babylonGreet>${logoBaylonJS} is awsome  !</babylonGreet>\n`;
    const sample = `<test id="test" style="color:#FF0000;">TextFormater</test>&nbsp;<i>will</i> work with\n${pixiJS} and ${babylonjs}\n<p id="someID" style='color:#0000FF; fontSize: 30'>${googleLink}<outline><b> is <i>your</i></b> friend ${smiley}...</outline></p>`;

    textfield.styles = {
      default: { fontName: "Calibri", fontSize: 50 },
      dancing: {
        color: "white",
        fontName: "Dancing Script Regular",
        shadowColor: "rgba(0, 0, 0, 0.9)",
        shadowBlur: 10,
        shadowOffsetX: 2,
        shadowOffsetY: 2
      },
      img: {
        // lineHeight: 5
      },
      pixi: {
        fontName: "Roboto Black",
        color: "#e91e63"
      },
      babylonGreet: {
        color: "white",
        //lineHeight: 15
      },
      balylon: {
        color: "#bb464b",
        fontName: "Roboto Bold",
        fontWeight: "Black",
        //lineHeight: 20
      },
      js: {
        fontName: "Roboto Light",
        fontWeight: "Thin"
      },
      smiley: {
        width: "30%",
        height: "30%"
      },
      google: {
        fontSize: 40,
        fontName: "Calibri",
        fontWeight: "Bold",
        fontStyle: "Italic"
      },
      red: { color: "#DB4437" },
      cyan: { color: "#4285F4" },
      yellow: { color: "#F4B400" },
      green: { color: "#0F9D58" },
      outline: {
        fontName: "Verdana",
        stroke: "#FFFFFF",
        strokeWidth: 2
      }
    };

    textfield.text = sample;

    window[`textfield`] = textfield;
    window[`FontLibrary`] = FontLibrary;
    window[`ImageLibrary`] = ImageLibrary;
  }

  async loadFonts(assets): Promise<void> {
    return new Promise((resolve) => {
      FontLibrary.loadFonts(assets).then(() => resolve());
    });
  }

  async loadImages(assets): Promise<void> {
    return new Promise((resolve) => {
      ImageLibrary.loadImages(assets).then(() => resolve());
    });
  }
}

new Exemple1();