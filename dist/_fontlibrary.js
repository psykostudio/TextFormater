var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class FontLibrary {
    static loadFonts(fonts) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = [];
            fonts.forEach(fontFile => {
                files.push(this.loadFont(fontFile));
            });
            yield Promise.all(files);
            console.log(`Formater: ${files.length} fonts loaded`, this.fontsByName);
            return true;
        });
    }
    static loadFont(fontFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                opentype.load(fontFile.path, (err, font) => {
                    if (err) {
                        reject("Could not load font: " + err);
                    }
                    else {
                        // store it for later use
                        this.registerFont(font);
                        resolve(font);
                    }
                });
            });
        });
    }
    static registerFont(font) {
        const fontFamily = font.getEnglishName("fontFamily");
        const fontSubfamily = font.getEnglishName("fontSubfamily");
        const fullName = font.getEnglishName("fullName");
        const postScriptName = font.getEnglishName("postScriptName");
        if (!this._defaultFontFamily) {
            this._defaultFontFamily = fontFamily;
        }
        this.fontsByName[`${fontFamily} ${fontSubfamily}`] = font;
        this.fontsByName[`${postScriptName}`] = font;
        this.fontsByName[`${fullName}`] = font;
        console.log(`Formater: font loaded\n\tfullName:${fullName}\n\tfamily:${fontFamily}\n\tsub familly:${fontSubfamily}\n\tpostscript:${postScriptName}`);
    }
    static getFontFromStyle(style) {
        return this.getFontByName(this.findBestMatchForStyle(style));
    }
    static findBestMatchForStyle(style) {
        const preferedOrder = [
            `${style.fontFamily} ${style.fontWeight} ${style.fontStyle}`,
            `${style.fontName} ${style.fontWeight} ${style.fontStyle}`,
            `${style.fontFamily} ${style.fontWeight}`,
            `${style.fontName} ${style.fontWeight}`,
            `${style.fontFamily} ${style.fontStyle}`,
            `${style.fontName} ${style.fontStyle}`,
            `${style.fontFamily}`,
            `${style.fontName}`,
            `${this._defaultFontFamily}`
        ];
        const bestMatch = preferedOrder.find(order => {
            return this.getFontByName(order) ? true : false;
        });
        return bestMatch;
    }
    static getFontByName(name) {
        return this.fontsByName[name];
    }
}
FontLibrary.fontsByName = {};
//# sourceMappingURL=_fontlibrary.js.map