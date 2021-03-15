import * as opentypejs from "opentype.js";
import { FontLibrary, Formater } from "@psykostudio/textformater";

console.log("exemple1.ts opentypejs", opentypejs);
console.log("formater:", Formater);

// a sample text to test
const sample = `<p>Hello <b>world</b>\n<a href="https://www.google.com"><i>google</i> est ton ami</a></p><p id="someID" style='color:#00FF00; fontSize: 30'><b>another <i>paragraph</i></b> with\nmulti lines...</p>`;

const formater = new Formater();

FontLibrary
  // first load some fonts
  .loadFonts([
    { name: "Calibri", path: "./assets/fonts/calibri.ttf" },
    { name: "Calibri Bold", path: "./assets/fonts/calibrib.ttf" },
    { name: "Calibri Italic", path: "./assets/fonts/calibrii.ttf" },
    { name: "Calibri Light", path: "./assets/fonts/calibril.ttf" },
    { name: "Calibri Light Italic", path: "./assets/fonts/calibrili.ttf" },
    { name: "Calibri Bold Italic", path: "./assets/fonts/calibriz.ttf" }
  ])
  .then(() => {
    formater.parse(sample);
  });