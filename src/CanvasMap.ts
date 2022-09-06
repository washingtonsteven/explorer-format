import { fabric } from "fabric";
import nodeTest from "node:test";

// TODO: maps that are larger than the canvas, allow for zoom, pan, etc.
// See: http://fabricjs.com/fabric-intro-part-5#pan_zoom

// Use the symbol in the comment to specify border on the particular node
// It's just hex
// i.e. node "8" has a left and top border, "7" is left and bottom, etc.
// 73333336 represents a "floor" i.e. |_ _ _ _ _ _ _ _|
// b through e are "end caps"
// f is just a box
// Any other symbol renders nothing. "x" is a good placeholder. You could use space i guess.
const NODE_BORDER_TABLE = [
	"", // 0
	"t", // 1
	"r", // 2
	"b", // 3
	"l", // 4
	"tr", // 5
	"rb", // 6
	"bl", // 7
	"lt", // 8
	"tb", // 9
	"lr", // a
	"rtl", // b
	"trb", // c
	"rbl", // d
	"blt", // e
	"tblr", // f
];

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
				8111115xxx
				400003015x
				40036x402x
				736xxx733c
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
						if (isNaN(parseInt(node, 16))) {
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

						const borders = NODE_BORDER_TABLE[parseInt(node, 16)];

						if (borders) {
							borders.split("").forEach((borderDir) => {
								// top
								let startX = xCoord;
								let startY = yCoord;
								let endX = xCoord + mapData.nodeWidth;
								let endY = startY;

								if (borderDir === "b") {
									startY = yCoord + mapData.nodeHeight;
									endY = startY;
								}
								if (borderDir === "r") {
									startX = xCoord + mapData.nodeWidth;
									endX = startX;
									endY = yCoord + mapData.nodeHeight;
								}
								if (borderDir === "l") {
									endX = startX;
									endY = yCoord + mapData.nodeHeight;
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
