export class Utils {
	public static extractNumber(str: string | number, baseProperty: number): number {
		if (typeof (str) === "string") {
			if (str.indexOf("%") > -1) {
				const ratio = parseInt(str.replace("%", ""), 10) / 100;
				return ratio * baseProperty;
			} else {
				return parseInt(str.replace("px", ""), 10);
			}
		} else {
			return str;
		}
	}

	public static nearestUpperPowerOfTwo(x: number): number {
		let power = 1;
		while (power < x) power *= 2;
		return power;
	}

	public static assign(from: any, to: any): any {
		let result = Object.assign({}, to);
		from.forEach((child) => {
			result = Object.assign(result, child);
		});
		return result;
	}

	public static deepAssign(objTo, ...objs) {
		objs.forEach(obj => {
			obj && this.deepAssignSingle(objTo, obj);
		});
		return objTo;
	}

	public static deepAssignSingle(objTo, obj) {
		if (obj instanceof Array) {
			objTo = [];
			obj.forEach(item => {
				objTo.push(this.deepAssignSingle({}, item));
			});
			return;
		}
		let keys = Object.keys(obj);
		keys.forEach(key => {
			if (typeof obj[key] == "object") {
				if (obj[key] instanceof Array) {
					objTo[key] = [];
					obj[key].forEach(item => {
						let temp = {};
						this.deepAssignSingle(temp, item);
						objTo[key].push(temp);
					});
				} else {
					if (typeof objTo[key] != "object" || objTo[key] instanceof Array) {
						objTo[key] = {};
					}
					this.deepAssignSingle(objTo[key], obj[key]);
				}
			} else {
				objTo[key] = obj[key];
			}
		});
	};
}