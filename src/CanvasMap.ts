import { fabric } from "fabric";

// Set map.nodes to a string containing any characters
// If the character is valid hex (i.e. 0-9 and a-f), it will be interpreted with a border
// bit masks go top, right, bottom, left from most significant to least.
// e.g. "a" => 0xa => 0b1010 => top and bottom borders
// e.g. "5" => 0x5 => 0b0101 => right and left borders

const BORDER_TOP = 0x8;
const BORDER_RIGHT = 0x4;
const BORDER_BOTTOM = 0x2;
const BORDER_LEFT = 0x1;

export interface CanvasMapDefaultData {
	gridCols: number;
	gridRows: number;
	blockWidth: number;
	blockHeight: number;
	color: string;
	highlightColor: string;
	borderColor: string;
}

export type HighlightPoint = {
	x: number;
	y: number;
} | null;

type ViewportSize = {
	width: number;
	height: number;
};

interface PassageMap {
	map: string;
	name: string;
}

type CanvasMapData = CanvasMapDefaultData & {
	map: string;
	highlight?: HighlightPoint;
};

class CanvasMap {
	canvasElem: HTMLCanvasElement;
	canvas: fabric.Canvas;
	isDragging: boolean;
	lastPosX: number;
	lastPosY: number;
	initialVPT?: number[];
	defaultMapData: CanvasMapDefaultData;
	maps: PassageMap[];
	currentMap: PassageMap | null;
	viewportSize: ViewportSize;

	constructor() {
		const canvasElem =
			document.querySelector<HTMLCanvasElement>("canvas#map");
		if (!canvasElem) {
			throw new Error(`No canvas found!`);
		}

		this.canvasElem = canvasElem;

		const viewWidth = parseInt(
			this.canvasElem.getAttribute("width") || "300"
		);
		const viewHeight = parseInt(
			this.canvasElem.getAttribute("height") || "300"
		);
		this.viewportSize = {
			width: isNaN(viewWidth) ? 300 : viewWidth,
			height: isNaN(viewHeight) ? 300 : viewHeight,
		};

		this.canvas = new fabric.Canvas(this.canvasElem, {
			selection: false,
		});
		this.initialVPT = this.canvas.viewportTransform;

		this.canvas.on("mouse:wheel", (opt) => {
			const delta = opt.e.deltaY;
			let zoom = this.canvas.getZoom();
			zoom *= 0.999 ** delta;
			if (zoom > 20) zoom = 20;
			if (zoom < 0.2) zoom = 0.2;
			this.canvas.zoomToPoint(
				{ x: opt.e.offsetX, y: opt.e.offsetY },
				zoom
			);
			opt.e.preventDefault();
			opt.e.stopPropagation();
		});

		this.canvas.on("mouse:down", (opt) => {
			const e = opt.e;
			if (e.altKey === true) {
				this.isDragging = true;
				this.lastPosX = e.clientX;
				this.lastPosY = e.clientY;
			}
		});

		this.canvas.on("mouse:move", (opt) => {
			if (this.isDragging) {
				const e = opt.e;
				const vpt = this.canvas.viewportTransform;
				if (vpt) {
					vpt[4] += e.clientX - this.lastPosX;
					vpt[5] += e.clientY - this.lastPosY;
					this.canvas.requestRenderAll();
					this.lastPosX = e.clientX;
					this.lastPosY = e.clientY;
				}
			}
		});

		this.canvas.on("mouse:up", (opt) => {
			if (this.canvas.viewportTransform) {
				this.canvas.setViewportTransform(this.canvas.viewportTransform);
			}
			this.isDragging = false;
		});

		this.defaultMapData = {
			gridCols: 20,
			gridRows: 20,
			blockWidth: 25,
			blockHeight: 25,
			color: "#ffd700",
			highlightColor: "#fff",
			borderColor: "#333",
		};

		this.maps = [];

		this.currentMap = null;
	}

	setDefaultMapData(data: CanvasMapDefaultData) {
		this.defaultMapData = {
			...this.defaultMapData,
			...data,
		};
	}

	addMap(map: PassageMap) {
		this.maps.push(map);
	}

	displayMap(mapName: string, highlight?: HighlightPoint) {
		const passageMap = this.maps.find((m) => m.name === mapName);
		if (!passageMap) {
			throw new Error(`Unable to find map named ${mapName}!`);
		}

		const mapData: CanvasMapData = {
			...this.defaultMapData,
			map: passageMap.map,
			highlight,
		};

		this.currentMap = passageMap;

		this.clear();
		this.drawMapNodes(mapData);
		this.drawGridLines(mapData);

		const vpt = this.canvas.viewportTransform;
		const halfMapWidth = (mapData.blockWidth * mapData.gridCols) / 2;
		const halfMapHeight = (mapData.blockHeight * mapData.gridRows) / 2;
		if (vpt) {
			vpt[4] = -halfMapWidth + this.viewportSize.width / 2;
			vpt[5] = -halfMapHeight + this.viewportSize.height / 2;
		}

		if (highlight) {
			const focusX =
				highlight.x * mapData.blockWidth + mapData.blockWidth / 2;
			const focusY =
				highlight.y * mapData.blockHeight + mapData.blockHeight / 2;

			const vpt = this.canvas.viewportTransform;
			if (vpt) {
				vpt[4] = -focusX + this.viewportSize.width / 2;
				vpt[5] = -focusY + this.viewportSize.height / 2;
			}
		}
	}

	clear() {
		this.currentMap = null;
		this.canvas.clear();
	}

	drawMapNodes(mapData: CanvasMapData) {
		// TODO: don't redraw map if it's already up
		//       may have to redraw the highlight though
		mapData.map
			.trim()
			.split("\n")
			.forEach((line, row) => {
				line.trim()
					.split("")
					.forEach((node, col) => {
						this.drawMapNode(mapData, node, row, col);
					});
			});
	}

	drawGridLines(mapData: CanvasMapData) {
		// grid lines
		//vert
		let c = 0;
		for (c = 0; c <= mapData.gridCols; c++) {
			const startX = c * mapData.blockWidth;
			const startY = 0;
			const endX = startX;
			const endY = mapData.gridRows * mapData.blockHeight;

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: mapData.borderColor,
				strokeWidth: 1,
				selectable: false,
			});

			this.canvas.add(l);
		}
		//hori
		for (c = 0; c <= mapData.gridRows; c++) {
			const startX = 0;
			const startY = c * mapData.blockHeight;
			const endX = mapData.gridCols * mapData.blockWidth;
			const endY = startY;

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: mapData.borderColor,
				strokeWidth: 1,
				selectable: false,
			});

			this.canvas.add(l);
		}
	}

	drawMapNode(
		mapData: CanvasMapData,
		node: string,
		row: number,
		col: number
	) {
		const nodeParsed = parseInt(node, 16);
		if (isNaN(nodeParsed)) {
			return;
		}

		const xCoord = col * mapData.blockWidth;
		const yCoord = row * mapData.blockHeight;
		const r = new fabric.Rect({
			left: xCoord,
			top: yCoord,
			fill: mapData.color,
			width: mapData.blockWidth,
			height: mapData.blockHeight,
			selectable: false,
		});

		this.canvas.add(r);

		if (
			mapData.highlight &&
			mapData.highlight.x === col &&
			mapData.highlight.y === row
		) {
			this.drawMapNodeHighlight(mapData, xCoord, yCoord);
		}

		this.drawMapNodeBorders(mapData, nodeParsed, xCoord, yCoord);
	}

	drawMapNodeHighlight(
		mapData: CanvasMapData,
		xCoord: number,
		yCoord: number
	) {
		const h = new fabric.Rect({
			left: xCoord,
			top: yCoord,
			fill: mapData.highlightColor,
			width: mapData.blockWidth,
			height: mapData.blockHeight,
			opacity: 0,
			selectable: false,
		});
		this.canvas.add(h);

		const animateOn = () => {
			h.animate("opacity", 1, {
				duration: 250,
				onComplete: animateOff,
				onChange: this.canvas.renderAll.bind(this.canvas),
			});
		};

		const animateOff = () => {
			h.animate("opacity", 0, {
				duration: 250,
				onComplete: () => setTimeout(animateOn, 500),
				onChange: this.canvas.renderAll.bind(this.canvas),
			});
		};

		animateOn();
	}

	drawMapNodeBorders(
		mapData: CanvasMapData,
		node: number,
		xCoord: number,
		yCoord: number
	) {
		const borders: number[] = [];
		borders.push(node & BORDER_TOP);
		borders.push(node & BORDER_RIGHT);
		borders.push(node & BORDER_BOTTOM);
		borders.push(node & BORDER_LEFT);

		if (borders) {
			borders.forEach((borderDir) => {
				let startX: number, startY: number, endX: number, endY: number;

				if (borderDir === BORDER_TOP) {
					startX = xCoord;
					startY = yCoord;
					endX = xCoord + mapData.blockWidth;
					endY = startY;
				} else if (borderDir === BORDER_BOTTOM) {
					startX = xCoord;
					startY = yCoord + mapData.blockHeight;
					endX = xCoord + mapData.blockWidth;
					endY = startY;
				} else if (borderDir === BORDER_RIGHT) {
					startX = xCoord + mapData.blockWidth;
					startY = yCoord;
					endX = startX;
					endY = yCoord + mapData.blockHeight;
				} else if (borderDir === BORDER_LEFT) {
					startX = xCoord;
					startY = yCoord;
					endX = startX;
					endY = yCoord + mapData.blockHeight;
				} else {
					return;
				}

				const l = new fabric.Line([startX, startY, endX, endY], {
					stroke: mapData.borderColor,
					strokeWidth: 2,
					strokeLineJoin: "round",
					selectable: false,
				});

				this.canvas.add(l);
			});
		}
	}
}

export default CanvasMap;
