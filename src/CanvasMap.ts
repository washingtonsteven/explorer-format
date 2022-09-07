import { fabric } from "fabric";

// TODO: maps that are larger than the canvas, allow for zoom, pan, etc.
// See: http://fabricjs.com/fabric-intro-part-5#pan_zoom

// Set map.nodes to a string containing any characters
// If the character is valid hex (i.e. 0-9 and a-f), it will be interpreted with a border
// bit masks go top, right, bottom, left from most significant to least.
// e.g. "a" => 0xa => 0b1010 => top and bottom borders
// e.g. "5" => 0x5 => 0b0101 => right and left borders

const BORDER_TOP = 0x8;
const BORDER_RIGHT = 0x4;
const BORDER_BOTTOM = 0x2;
const BORDER_LEFT = 0x1;

class CanvasMap {
	canvasElem: HTMLCanvasElement;
	canvas: fabric.Canvas;
	isDragging: boolean;
	lastPosX: number;
	lastPosY: number;
	initialVPT?: number[];

	constructor() {
		const canvasElem =
			document.querySelector<HTMLCanvasElement>("canvas#map");
		if (!canvasElem) {
			throw new Error(`No canvas found!`);
		}

		this.canvasElem = canvasElem;

		// init
		this.canvas = new fabric.Canvas(this.canvasElem, {
			selection: false,
		});
		this.initialVPT = this.canvas.viewportTransform;

		const mapData = {
			nodeWidth: 25, // width/height of head box, in pixels
			nodeHeight: 25,
			gridWidth: 20, // how many grid spaces there are (i.e. map width in pixels is gridWidth * nodeWidth)
			gridHeight: 20,
			fillColor: "#ffd700",
			borderColor: "#333",
			nodes: `
				988888cxxx
				10000208cx
				10026x104x
				326xxx326e
			`,
			highlight: {
				x: 3,
				y: 1,
			},
		};

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

		mapData.nodes
			.trim()
			.split("\n")
			.forEach((line, row) => {
				line.trim()
					.split("")
					.forEach((node, col) => {
						const nodeParsed = parseInt(node, 16);
						if (isNaN(nodeParsed)) {
							return;
						}

						const xCoord = col * mapData.nodeWidth;
						const yCoord = row * mapData.nodeHeight;
						const r = new fabric.Rect({
							left: xCoord,
							top: yCoord,
							fill: mapData.fillColor,
							width: mapData.nodeWidth,
							height: mapData.nodeHeight,
							selectable: false,
						});

						this.canvas.add(r);

						if (
							mapData.highlight &&
							mapData.highlight.x === col &&
							mapData.highlight.y === row
						) {
							const h = new fabric.Rect({
								left: xCoord,
								top: yCoord,
								fill: "#fff",
								width: mapData.nodeWidth,
								height: mapData.nodeHeight,
								opacity: 0,
								selectable: false,
							});
							this.canvas.add(h);

							const animateOn = () => {
								h.animate("opacity", 1, {
									duration: 250,
									onComplete: animateOff,
									onChange: this.canvas.renderAll.bind(
										this.canvas
									),
								});
							};

							const animateOff = () => {
								h.animate("opacity", 0, {
									duration: 250,
									onComplete: () =>
										setTimeout(animateOn, 500),
									onChange: this.canvas.renderAll.bind(
										this.canvas
									),
								});
							};

							animateOn();
						}

						const borders: number[] = [];
						borders.push(nodeParsed & BORDER_TOP);
						borders.push(nodeParsed & BORDER_RIGHT);
						borders.push(nodeParsed & BORDER_BOTTOM);
						borders.push(nodeParsed & BORDER_LEFT);

						if (borders) {
							borders.forEach((borderDir) => {
								let startX, startY, endX, endY;

								if (borderDir === BORDER_TOP) {
									startX = xCoord;
									startY = yCoord;
									endX = xCoord + mapData.nodeWidth;
									endY = startY;
								} else if (borderDir === BORDER_BOTTOM) {
									startX = xCoord;
									startY = yCoord + mapData.nodeHeight;
									endX = xCoord + mapData.nodeWidth;
									endY = startY;
								} else if (borderDir === BORDER_RIGHT) {
									startX = xCoord + mapData.nodeWidth;
									startY = yCoord;
									endX = startX;
									endY = yCoord + mapData.nodeHeight;
								} else if (borderDir === BORDER_LEFT) {
									startX = xCoord;
									startY = yCoord;
									endX = startX;
									endY = yCoord + mapData.nodeHeight;
								} else {
									return;
								}

								const l = new fabric.Line(
									[startX, startY, endX, endY],
									{
										stroke: mapData.borderColor,
										strokeWidth: 2,
										strokeLineJoin: "round",
										selectable: false,
									}
								);

								this.canvas.add(l);
							});
						}
					});
			});

		// grid lines
		//vert
		let c = 0;
		for (c = 0; c <= mapData.gridWidth; c++) {
			const startX = c * mapData.nodeWidth;
			const startY = 0;
			const endX = startX;
			const endY = mapData.gridHeight * mapData.nodeHeight; // TODO: infer this?

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: mapData.borderColor,
				strokeWidth: 1,
				selectable: false,
			});

			this.canvas.add(l);
		}
		//hori
		for (c = 0; c <= mapData.gridHeight; c++) {
			const startX = 0;
			const startY = c * mapData.nodeHeight;
			const endX = mapData.gridWidth * mapData.nodeWidth;
			const endY = startY;

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: mapData.borderColor,
				strokeWidth: 1,
				selectable: false,
			});

			this.canvas.add(l);
		}
	}
}

export default CanvasMap;
