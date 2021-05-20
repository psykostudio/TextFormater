import { Point } from "opentype.js";
import { LeafBackup } from "../../leaf";
import { IRenderPass, RenderPassTypes, TextRenderer } from "../renderer";

export class CanvasTextRenderer extends TextRenderer {
	public constructor(renderingPasses: CanvasTextRendererPass[]) {
		super();
		this._renderingPasses = renderingPasses;
	}

	public static defaultRenderer(): CanvasTextRenderer {
		return new CanvasTextRenderer([
			// new CanvasDebugRenderPass(),
			new CanvasShadowRenderPass(),
			new CanvasImageRenderPass(),
			new CanvasStrokeRenderPass(),
			new CanvasFillRenderPass()
		]);
	}
}

export class CanvasTextRendererPass {
	public draw(leaf: LeafBackup, context: CanvasRenderingContext2D, offsetX: number = 0, offsetY: number = 0) {
		context.beginPath();

		for (let i = 0; i < leaf.path.commands.length; i += 1) {
			const cmd = leaf.path.commands[i];
			if (cmd.type === "M") {
				context.moveTo(cmd.x + offsetX, cmd.y + offsetY);
			} else if (cmd.type === "L") {
				context.lineTo(cmd.x + offsetX, cmd.y + offsetY);
			} else if (cmd.type === "C") {
				context.bezierCurveTo(cmd.x1 + offsetX, cmd.y1 + offsetY, cmd.x2 + offsetX, cmd.y2 + offsetY, cmd.x + offsetX, cmd.y + offsetY);
			} else if (cmd.type === "Q") {
				context.quadraticCurveTo(cmd.x1 + offsetX, cmd.y1 + offsetY, cmd.x + offsetX, cmd.y + offsetY);
			} else if (cmd.type === "Z") {
				context.closePath();
			}
		}
	}

	public drawLine(context: CanvasRenderingContext2D, from: { x: number, y: number }, to: { x: number, y: number }, lineWidth: number, color: string) {
		context.strokeStyle = color;
		context.lineWidth = lineWidth;
		context.moveTo(from.x, from.y);
		context.lineTo(to.x, to.y);
		context.stroke();
	}

	public drawRect(context: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }, lineWidth: number, color: string) {
		context.strokeStyle = color;
		context.lineWidth = lineWidth;

		context.rect(rect.x, rect.y, rect.width, rect.height);

		context.stroke();
	}
}

export class CanvasImageRenderPass extends CanvasTextRendererPass {
	type: string = RenderPassTypes.ImageRenderPass;
	apply(renderer: CanvasTextRenderer, leaf: LeafBackup): void {
		leaf.drawImage(renderer.context, renderer.padding.left, renderer.padding.top);
	}
}

export class CanvasFillRenderPass extends CanvasTextRendererPass {
	type: string = RenderPassTypes.FillRenderPass;
	apply(renderer: CanvasTextRenderer, leaf: LeafBackup): void {
		if (leaf.style.color) {
			this.draw(leaf, renderer.context, renderer.padding.left, renderer.padding.top);
			renderer.context.fillStyle = leaf.style.color;
			renderer.context.fill();
		}
	}
}

export class CanvasStrokeRenderPass extends CanvasTextRendererPass {
	type: string = RenderPassTypes.StrokeRenderPass;
	apply(renderer: CanvasTextRenderer, leaf: LeafBackup): void {
		if (leaf.style.stroke) {
			this.draw(leaf, renderer.context, renderer.padding.left, renderer.padding.top);

			renderer.context.strokeStyle = leaf.style.stroke;
			renderer.context.fillStyle = leaf.style.stroke;
			renderer.context.lineWidth = leaf.style.strokeWidth * 2;
			renderer.context.fill();
			renderer.context.stroke();
		}
	}
}

export class CanvasShadowRenderPass extends CanvasTextRendererPass {
	type: string = RenderPassTypes.ShadowRenderPass;
	apply(renderer: CanvasTextRenderer, leaf: LeafBackup): void {
		if (leaf.style.shadowColor && leaf.style.shadowBlur) {
			this.draw(leaf, renderer.context, renderer.padding.left, renderer.padding.top);

			renderer.context.shadowColor = leaf.style.shadowColor;
			renderer.context.shadowBlur = leaf.style.shadowBlur || 0;
			renderer.context.shadowOffsetX = leaf.style.shadowOffsetX || 0;
			renderer.context.shadowOffsetY = leaf.style.shadowOffsetY || 0;
			renderer.context.fillStyle = leaf.style.shadowColor;
			renderer.context.fill();
		}
	}
}

export class CanvasDebugRenderPass extends CanvasTextRendererPass {
	type: string = RenderPassTypes.DebugRenderPass;
	apply(renderer: CanvasTextRenderer, leaf: LeafBackup): void {
		const pos = leaf.roundedPosition;

		const baseLine = {
			x: pos.x + renderer.padding.left,
			y: pos.y + leaf.baseLine - leaf.height + renderer.padding.top
		}

		this.drawLine(
			renderer.context,
			baseLine,
			{ x: baseLine.x + leaf.width, y: baseLine.y },
			1,
			"#FF0000"
		);
		/*
				this.drawRect(
					renderer.context,
					{
						x: pos.x + renderer.padding.left,
						//y: pos.y - leaf.baseLine + renderer.padding.top,
						y: pos.y + (leaf.height - leaf.baseLine) + renderer.padding.top,
						width: leaf.width,
						height: leaf.height
					},
					1,
					"#00FF00"
				);
				*/
	}
}