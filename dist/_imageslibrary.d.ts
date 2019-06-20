export declare class ImageLibrary {
    private static imagesByName;
    static loadImages(urls: {
        url: string;
        id?: string;
    }[]): Promise<any[]>;
    static loadImage(img: {
        url: string;
        id?: string;
    }): Promise<{}>;
    private static registerImage(img, image);
    static getImage(urlOrId: string): HTMLImageElement;
}
