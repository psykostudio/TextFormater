"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Leaf {
    constructor(raw, token) {
        this.glyphs = [];
        this.raw = raw;
        this.token = token;
        this.style = this.token[`style`];
        this.font = this.style.font;
        this.fontSize = Math.round(this.style.fontSize);
        this.fontRatio = (1 / this.font.unitsPerEm) * this.fontSize;
        this.splitInGlyphs();
    }
    draw(context, renderOptions) {
        let lastX = 0;
        let previous = null;
        this.glyphs.forEach(glyph => {
            if (glyph.char == "\n")
                return;
            const path = glyph.getPath(this.x + lastX, this.y, this.fontSize, renderOptions, this.font);
            if (previous && renderOptions.kerning) {
                const kerning = this.font.getKerningValue(previous, glyph);
                previous.advanceWidth += kerning;
            }
            lastX += glyph.advanceWidth * this.fontRatio;
            path[`fill`] = this.style.color;
            path.draw(context);
        });
        this.width = lastX;
        console.log(this);
    }
    splitInGlyphs() {
        this.raw.split("").forEach((char) => {
            const glyph = this.font.charToGlyph(char);
            glyph.char = char;
            this.glyphs.push(glyph);
        });
    }
}
exports.Leaf = Leaf;
//# sourceMappingURL=word.js.map