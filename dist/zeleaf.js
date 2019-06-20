import { Path } from "opentype.js";
import { ImageLibrary } from "./imagesLibrary";
export var LeafType;
(function (LeafType) {
    LeafType["Space"] = "Space";
    LeafType["NewLine"] = "NewLine";
    LeafType["Tabulation"] = "Tabulation";
    LeafType["Word"] = "Word";
    LeafType["Glyph"] = "Glyph";
    LeafType["Image"] = "Image";
})(LeafType || (LeafType = {}));
export class Leaf {
    constructor(text, token, renderer, parent, previous) {
        this.children = [];
        this._x = 0;
        this._y = 0;
        this.height = 0;
        this._previous = null;
        this._next = null;
        this.text = text;
        this.token = token;
        this.style = this.token[`style`];
        this.attributes = this.token[`attributes`];
        this.renderer = renderer;
        this.parent = parent;
        this.previous = previous;
        this.letterSpacing = this.style.letterSpacing || 0;
        this.font = this.style.font;
        this.fontSize = Math.round(this.style.fontSize * this.renderer.resolution);
        this.fontRatio = (1 / this.font.unitsPerEm) * this.fontSize;
        this.baseLine = this.font.ascender * this.fontRatio;
        this.lineHeight = this.style.lineHeight || 0;
        this.identify();
    }
    identify() {
        if (this.text.length > 1) {
            this.type = LeafType.Word;
            this.splitInGlyphs();
        }
        else {
            if (this.token.name === "img") {
                this.type = LeafType.Image;
                const imgSrc = this.attributes.getByName("src").value;
                this.image = ImageLibrary.getImage(imgSrc);
                this.width = this.attributes.getByName("width").asInteger * this.renderer.resolution;
                this.height = this.attributes.getByName("height").asInteger * this.renderer.resolution;
            }
            else {
                switch (this.text) {
                    case " ":
                        this.type = LeafType.Space;
                        break;
                    case "\t":
                        this.type = LeafType.Tabulation;
                        break;
                    case "↵":
                    case "\r":
                    case "\n":
                        this.type = LeafType.NewLine;
                        break;
                    default:
                        if (this.text.length === 1) {
                            this.type = LeafType.Glyph;
                        }
                        break;
                }
                this.buildGlyph();
            }
        }
    }
    drawImage(context) {
        const drawPosition = {
            x: Math.round(this.x),
            y: Math.round(this.y - this.baseLine),
        };
        if (!this.image) {
            const imgSrc = this.attributes.getByName("src").value;
            ImageLibrary.loadImage({ url: imgSrc }).then(() => {
                this.image = ImageLibrary.getImage(imgSrc);
                this.image.width = this.width;
                this.image.height = this.height;
                context.drawImage(this.image, drawPosition.x, drawPosition.y, this.width, this.height);
            });
        }
        else {
            this.image.width = this.width;
            this.image.height = this.height;
            context.drawImage(this.image, drawPosition.x, drawPosition.y, this.width, this.height);
        }
    }
    loadImage(cb) {
        this.image = new Image();
        this.image.src = this.attributes.getByName("src").value;
        this.image.onload = cb;
    }
    contains(point) {
        const roundedBounds = {
            x: Math.round(this.x),
            y: Math.round(this.y - this.baseLine),
            width: Math.round(this.width),
            height: Math.round(this.height),
        };
        if (point.x < roundedBounds.x)
            return false;
        if (point.x > roundedBounds.x + roundedBounds.width)
            return false;
        if (point.y < roundedBounds.y)
            return false;
        if (point.y > roundedBounds.y + roundedBounds.height)
            return false;
        return true;
    }
    draw(context) {
        context.beginPath();
        for (let i = 0; i < this.path.commands.length; i += 1) {
            const cmd = this.path.commands[i];
            if (cmd.type === "M") {
                context.moveTo(cmd.x, cmd.y);
            }
            else if (cmd.type === "L") {
                context.lineTo(cmd.x, cmd.y);
            }
            else if (cmd.type === "C") {
                context.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
            }
            else if (cmd.type === "Q") {
                context.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
            }
            else if (cmd.type === "Z") {
                context.closePath();
            }
        }
    }
    getPath() {
        if (this.children.length > 0) {
            this.path = new Path();
            this.children.forEach(child => {
                this.path.extend(child.getPath());
            });
        }
        else if (this.type !== LeafType.Image) {
            this.path = this.glyph.getPath(this.roundedPosition.x, this.roundedPosition.y, this.fontSize, this.renderer.renderOptions, this.font);
        }
        return this.path;
    }
    get roundedPosition() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
        };
    }
    getGlyphBound() {
        if (this.renderer.renderOptions.kerning &&
            this.previous &&
            this.previous.glyph) {
            const kerning = this.font.getKerningValue(this.previous.glyph, this.glyph);
            this.previous.glyph.advanceWidth += kerning;
        }
        const width = this.glyph.advanceWidth * this.fontRatio;
        const yDiff = this.glyph[`yMax`] ? this.glyph[`yMax`] - this.glyph[`yMin`] * this.fontRatio : this.fontSize;
        const height = isNaN(yDiff) ? 0 : yDiff;
        return { width, height };
    }
    buildGlyph() {
        this.glyph = this.font.charToGlyph(this.text);
        const bounds = this.getGlyphBound();
        this.width = bounds.width;
        this.height = bounds.height;
    }
    splitInGlyphs() {
        const chars = this.text.split("");
        let totalWidth = 0;
        chars.forEach((char, index) => {
            const child = new Leaf(char, this.token, this.renderer);
            child.previous = this.children[index - 1];
            child.parent = this;
            child.x = totalWidth;
            totalWidth += child.width + this.letterSpacing;
            this.height = Math.max(this.height, child.height);
            this.addChild(child);
        });
        this.width = totalWidth;
    }
    addChild(childs) {
        if (Array.isArray(childs)) {
            childs.forEach(child => {
                this.addChild(child);
            });
        }
        else {
            this.children.push(childs);
        }
    }
    set parent(value) {
        this._parent = value;
        if (!this.previous && this.parent) {
            this.previous = this.parent.previous;
        }
    }
    get parent() {
        return this._parent;
    }
    set previous(value) {
        this._previous = value;
        if (this._previous) {
            this._previous.next = this;
        }
    }
    get previous() {
        return this._previous;
    }
    set next(value) {
        this._next = value;
    }
    get next() {
        return this._next;
    }
    set x(value) {
        this._x = value;
    }
    get x() {
        return this._x + (this.parent ? this.parent.x : 0);
    }
    set y(value) {
        this._y = value;
    }
    get y() {
        return this._y + (this.parent ? this.parent.y : 0);
    }
}
//# sourceMappingURL=zeleaf.js.map