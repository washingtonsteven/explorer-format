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
	canvas: fabric.StaticCanvas;

	constructor() {
		const canvasElem =
			document.querySelector<HTMLCanvasElement>("canvas#map");
		if (!canvasElem) {
			throw new Error(`No canvas found!`);
		}

		console.log("MAP INITIALIZED");

		this.canvasElem = canvasElem;

		// init
		this.canvas = new fabric.StaticCanvas(this.canvasElem);
		const mapData = {
			nodeWidth: 20, // width/height of head box, in pixels
			nodeHeight: 20,
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
									}
								);

								this.canvas.add(l);
							});
						}
					});
			});

		// grid lines
		let c = 0;
		for (c = 0; c < mapData.gridWidth; c++) {
			const startX = c * mapData.nodeWidth;
			const startY = 0;
			const endX = startX;
			const endY = 300; // TODO: infer this?

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: mapData.borderColor,
				strokeWidth: 1,
			});

			this.canvas.add(l);
		}
		for (c = 0; c < mapData.gridHeight; c++) {
			const startX = 0;
			const startY = c * mapData.nodeHeight;
			const endX = 300;
			const endY = startY;

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: mapData.borderColor,
				strokeWidth: 1,
			});

			this.canvas.add(l);
		}
	}
}

export default CanvasMap;
