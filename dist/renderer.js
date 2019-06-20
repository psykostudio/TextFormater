import { LeafType } from "./leaf";
export class CanvasTextRenderer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        this._observers = [];
        this.resolution = 1;
        this.renderOptions = {
            hinting: true,
            kerning: true,
            features: {
                liga: true,
                rlig: true
            },
            letterSpacing: 100
        };
        this.padding = { top: 0, left: 0, right: 0, bottom: 0 };
        this.renderingPasses = [
            // this.debugRenderingPass,
            this.imagesRenderPass,
            this.shadowRenderPass,
            this.strokeRenderPass,
            this.fillRenderPass
        ];
        this.debug = document.getElementById("DEBUG");
        if (!this.debug) {
            this.debug = document.createElement("div");
            this.debug.id = "DEBUG";
            document.body.appendChild(this.debug);
        }
    }
    RegisterObserver(observer) {
        this._observers.push(observer);
    }
    RemoveObserver(observer) {
        this._observers.forEach((registered, index) => {
            if (registered === observer) {
                this._observers.splice(index, 1);
            }
        });
    }
    NotifyObservers() {
        this._observers.forEach((observer) => {
            observer.ReceiveNotification("UPDATE");
        });
    }
    nearestUpperPowerOfTwo(x) {
        let power = 1;
        while (power < x)
            power *= 2;
        return power;
    }
    clear(width, height) {
        this.canvas.width = this.nearestUpperPowerOfTwo(width || this.canvas.width);
        this.canvas.height = this.nearestUpperPowerOfTwo(height || this.canvas.height);
        this.debug.appendChild(this.canvas);
    }
    update(context) {
        this.renderingPasses.forEach(renderPass => {
            this.resetRenderPass(context);
            this.formater.leaves.forEach(leaf => {
                switch (leaf.type) {
                    case LeafType.Glyph:
                    case LeafType.Word:
                        if (renderPass !== this.imagesRenderPass) {
                            renderPass.call(this, context, leaf);
                        }
                        break;
                    case LeafType.Image:
                        if (renderPass === this.imagesRenderPass) {
                            renderPass.call(this, context, leaf);
                        }
                        break;
                }
            });
        });
        this.NotifyObservers();
    }
    resetRenderPass(context) {
        context.fillStyle = null;
        context.shadowColor = null;
        context.strokeStyle = null;
        context.lineWidth = 0;
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
    }
    debugRenderingPass(context, leaf) {
        const pos = leaf.roundedPosition;
        context.rect(pos.x + this.padding.left, pos.y - leaf.baseLine + this.padding.top, leaf.width, leaf.height);
        context.strokeStyle = leaf.style.stroke;
        context.lineWidth = leaf.style.strokeWidth * 2;
        context.stroke();
    }
    shadowRenderPass(context, leaf) {
        if (leaf.style.shadowColor && leaf.style.shadowBlur) {
            leaf.draw(context, this.padding.left, this.padding.top);
            context.shadowColor = leaf.style.shadowColor;
            context.shadowBlur = leaf.style.shadowBlur || 0;
            context.shadowOffsetX = leaf.style.shadowOffsetX || 0;
            context.shadowOffsetY = leaf.style.shadowOffsetY || 0;
            context.fillStyle = leaf.style.shadowColor;
            context.fill();
        }
    }
    strokeRenderPass(context, leaf) {
        if (leaf.style.stroke) {
            leaf.draw(context, this.padding.left, this.padding.top);
            context.strokeStyle = leaf.style.stroke;
            context.fillStyle = leaf.style.stroke;
            context.lineWidth = leaf.style.strokeWidth * 2;
            context.fill();
            context.stroke();
        }
    }
    fillRenderPass(context, leaf) {
        if (leaf.style.color) {
            leaf.draw(context, this.padding.left, this.padding.top);
            context.fillStyle = leaf.style.color;
            context.fill();
        }
    }
    imagesRenderPass(context, leaf) {
        leaf.drawImage(context, this.padding.left, this.padding.top);
    }
}
//# sourceMappingURL=renderer.js.map