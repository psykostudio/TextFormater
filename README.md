```typescript
// still need to figure out who nneds what and who need to do what...

// what i want:
Tokenize(); // html string to object
Format(); // handle styles and fonts attribution and create Glyphs
Layout(); // do some maths (bounds, line width, text height...) to build lines:Word[];
Render(); // draw all glyph, multipass (shadow, stroke, fill...)

// a sample text to test
const sample = `<p>Hello <b>world</b>\n<a href="https://www.google.com"><i>google</i> est ton ami</a></p><p id="someID" style='color:#00FF00; fontSize: 30'><b>another <i>paragraph</i></b> with\nmulti lines...</p>`;

const formater = new Formater();

formater
  // first load some fonts
  .loadFonts([
    { name: "Calibri", path: "./fonts/calibri.ttf" },
    { name: "Calibri Bold", path: "./fonts/calibrib.ttf" },
    { name: "Calibri Italic", path: "./fonts/calibrii.ttf" },
    { name: "Calibri Light", path: "./fonts/calibril.ttf" },
    { name: "Calibri Light Italic", path: "./fonts/calibrili.ttf" },
    { name: "Calibri Bold Italic", path: "./fonts/calibriz.ttf" }
  ])
  .then(() => {
    formater.parse(sample);
  });
```


```typescript
const textfield = new TextField("canvas");

await ImageLibrary.loadImages([
      { id: "logo_babylonjs", url: "./images/logo_babylonjs.png" },
      { id: "smiley_love", url: "./images/smiley_love.svg" }
    ]);

    await FontLibrary.loadFonts([
      { name: "Verdana", path: "./fonts/verdana.ttf" },
      { name: "Verdana Bold", path: "./fonts/verdanab.ttf" },
      { name: "Verdana Italic", path: "./fonts/verdanai.ttf" },
      { name: "Verdana Bold Italic", path: "./fonts/verdanaz.ttf" }
    ]);
      
    await FontLibrary.loadFonts([
      {
        name: "DancingScript",
        path: "./fonts/Dancing_Script/DancingScript-Regular.ttf"
      },
      {
        name: "DancingScript Bold",
        path: "./fonts/Dancing_Script/DancingScript-Bold.ttf"
      },

      {
        name: "Fascinate Inline",
        path: "./fonts/Fascinate_Inline/FascinateInline-Regular.ttf"
      },

      { name: "Lobster", path: "./fonts/Lobster/Lobster-Regular.ttf" },
      { name: "Vegan Style", path: "./fonts/Vegan Style.ttf" },
      { name: "Lemon Jelly", path: "./fonts/Lemon Jelly.ttf" },

      { name: "Roboto Black", path: "./fonts/Roboto/Roboto-Black.ttf" },
      { name: "Roboto Light", path: "./fonts/Roboto/Roboto-Light.ttf" },

      { name: "Calibri", path: "./fonts/calibri.ttf" },
      { name: "Calibri Bold", path: "./fonts/calibrib.ttf" },
      { name: "Calibri Italic", path: "./fonts/calibrii.ttf" },
      { name: "Calibri Light", path: "./fonts/calibril.ttf" },
      { name: "Calibri Light Italic", path: "./fonts/calibrili.ttf" },
      { name: "Calibri Bold Italic", path: "./fonts/calibriz.ttf" }
    ]);

textfield.formater.setStyles({
  default: { fontName: "Verdana" },
  dancing: {
  color: "white",
  fontName: "Dancing Script Regular",
  shadowColor: "rgba(0, 0, 0, 0.9)",
  shadowBlur: 10,
  shadowOffsetX: 2,
  shadowOffsetY: 2
  },
  babylonGreet: {
  color: "white",
  lineHeight: 15
  },
  balylon: {
  color: "#34495e",
  fontName: "Roboto Light",
  fontWeight: "Thin"
  },
  js: {
  fontName: "Roboto Black",
  fontWeight: "Black"
  },
  google: {
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
});

this.formater.addStyles({ fontName: "Calibri", fontSize: 60 });
this.formater.renderer.resolution = 2;

const google = `<google><cyan>G</cyan><red>o</red><yellow>o</yellow><cyan>g</cyan><green>l</green><red>e</red></google>`;
const googleLink = `<a href="https://www.google.com">${google}</a>`;
const babylonjs = `<img src="logo_babylonjs" width=80 height=80></img>`;
const logoBaylonJS = `<balylon>Babylon<js>.js</js></balylon>`;
const smiley = `<img src="smiley_love" width=40 height=40></img>`;
const dance = `<dancing>Dancing</dancing>`;
const babylonJSGreetings = `${babylonjs}<babylonGreet>${logoBaylonJS} is awsome ${smiley} !</babylonGreet>\n`;
const sample = `<p>${googleLink} is ${dance}</p>\n${babylonJSGreetings}<p id="someID" style='color:#00FF00; fontSize: 30'><outline><b>another <i>paragraph</i></b> with\nmulti lines...</outline></p>`;
```
