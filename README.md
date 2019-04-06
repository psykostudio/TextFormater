const sample = `<p>Hello <b>world</b>\n<a href="https://www.google.com"><i>google</i> est ton ami</a></p><p id="someID" style='color:#00FF00; fontSize: 30'><b>another <i>paragraph</i></b> with\nmulti lines...</p>`;

const formater = new Formater();

formater
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