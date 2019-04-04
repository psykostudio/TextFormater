import { Tokenizer, tokenTypes } from "./tokenizer";

export class Formater {
  private tokenizer: Tokenizer = new Tokenizer();
  private styles = {
    default: { fontName: "Arial", fontSize: 20, color: "#000000" },
    b: { fontName: "Arial Bold" },
    a: { color: "#0000FF", underline: true }
  };

  public parse(text: string) {
    const itr = this.tokenizer.tokenize(text);
    const styles = [];

    for (const token of itr) {
      switch (token.type) {
        case tokenTypes.OPENING_TAG:
          const tag = token[`name`];
          styles.push(this.styles[tag]);
          break;
        case tokenTypes.ATTRIBUTE:
          if (token[`name`] === "style") {
            styles.push(this.extractCustumStyle(token[`value`]));
          }
          console.log(token);
          break;
        case tokenTypes.CLOSING_TAG:
          styles.pop();
          break;
        case tokenTypes.TEXT:
          token[`style`] = this.mergeStyles(styles);
          console.log(token);
          break;
      }
    }
  }

  private mergeStyles(styles) {
    let style = Object.assign({}, this.styles.default);
    styles.forEach(styleToAdd => {
      style = Object.assign(style, styleToAdd);
    });
    return style;
  }

  private extractCustumStyle(value: string) {
    const styleString = value.replace(/ /g, "").split(";");
    let style = {};

    styleString.forEach(str => {
      const styleArray = str.split(":");
      style[styleArray[0]] = styleArray[1];
    });

    return style;
  }
}
