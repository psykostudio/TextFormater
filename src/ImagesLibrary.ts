export class ImageLibrary {
  private static imagesByName: { [urlOrId: string]: HTMLImageElement } = {};

  public static async loadImages(urls: { url: string; id?: string }[]) {
    const images = [];
    urls.forEach(url => {
      images.push(this.loadImage(url));
    });
    return await Promise.all(images);
  }

  public static async loadImage(img: { url: string; id?: string }) {
    return new Promise(resolve => {
      const image: HTMLImageElement = new Image();
      image.onload = () => {
        this.registerImage(img, image);
        resolve(image);
      };
      image.src = img.url;
    });
  }

  private static registerImage(
    img: { url: string; id?: string },
    image: HTMLImageElement
  ) {
    this.imagesByName[`${img.url}`] = image;
    if (img.id) { this.imagesByName[`${img.id}`] = image; }
  }

  public static getImage(urlOrId: string): HTMLImageElement {
    return this.imagesByName[urlOrId];
  }
}
