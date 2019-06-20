var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class ImageLibrary {
    static loadImages(urls) {
        return __awaiter(this, void 0, void 0, function* () {
            const images = [];
            urls.forEach(url => {
                images.push(this.loadImage(url));
            });
            return yield Promise.all(images);
        });
    }
    static loadImage(img) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                const image = new Image();
                image.onload = () => {
                    this.registerImage(img, image);
                    resolve(image);
                };
                image.src = img.url;
            });
        });
    }
    static registerImage(img, image) {
        this.imagesByName[`${img.url}`] = image;
        if (img.id) {
            this.imagesByName[`${img.id}`] = image;
        }
    }
    static getImage(urlOrId) {
        return this.imagesByName[urlOrId];
    }
}
ImageLibrary.imagesByName = {};
//# sourceMappingURL=_imageslibrary.js.map