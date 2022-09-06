import { fabric } from "fabric";

// TODO: maps that are larger than the canvas, allow for zoom, pan, etc.
// See: http://fabricjs.com/fabric-intro-part-5#pan_zoom

class CanvasMap {
	canvasElem: HTMLCanvasElement;
	canvas: fabric.Canvas;

	constructor() {
		const canvasElem =
			document.querySelector<HTMLCanvasElement>("canvas#map");
		if (!canvasElem) {
			throw new Error(`No canvas found!`);
		}

		console.log("MAP INITIALIZED");

		this.canvasElem = canvasElem;

		// init
		this.canvas = new fabric.Canvas(this.canvasElem);
		const mapData = {
			nodeWidth: 15,
			nodeHeight: 15,
			gridWidth: 20,
			gridHeight: 20,
			fillColor: "#ffd700",
			borderColor: "#ccc",
			nodes: [
				{
					gridX: 1,
					gridY: 1,
					borders: ["top", "left", "bottom"],
					fill: true,
					highlight: false,
				},
				{
					gridX: 2,
					gridY: 1,
					borders: ["top", "bottom"],
					fill: true,
					highlight: false,
				},
				{
					gridX: 3,
					gridY: 1,
					borders: ["top", "right"],
					fill: true,
					highlight: true,
				},
				{
					gridX: 3,
					gridY: 2,
					borders: ["left", "bottom", "right"],
					fill: true,
					highlight: false,
				},
			],
		};

		// nodes
		mapData.nodes.forEach((node) => {
			const xCoord = node.gridX * mapData.nodeWidth;
			const yCoord = node.gridY * mapData.nodeHeight;

			const nodeRect = new fabric.Rect({
				left: xCoord,
				top: yCoord,
				fill: node.fill ? mapData.fillColor : "#00000000",
				width: mapData.nodeWidth,
				height: mapData.nodeHeight,
				hasControls: false,
			});

			this.canvas.add(nodeRect);

			if (node.highlight) {
				const highlightRect = new fabric.Rect({
					left: xCoord,
					top: yCoord,
					fill: "#fff",
					width: mapData.nodeWidth,
					height: mapData.nodeHeight,
					hasControls: false,
					opacity: 0,
				});
				this.canvas.add(highlightRect);

				const animateOff = () => {
					highlightRect.animate("opacity", 0, {
						duration: 250,
						onComplete: () => setTimeout(animateOn, 500),
						onChange: this.canvas.renderAll.bind(this.canvas),
					});
				};
				const animateOn = () => {
					highlightRect.animate("opacity", 1, {
						duration: 250,
						onComplete: animateOff,
						onChange: this.canvas.renderAll.bind(this.canvas),
					});
				};
				animateOn();
			}

			node.borders.forEach((borderDir) => {
				// Default, top border
				let startX = xCoord;
				let startY = yCoord;
				let endX = xCoord + mapData.nodeWidth;
				let endY = startY;

				// left
				if (borderDir === "left") {
					endX = startX;
					endY = startY + mapData.nodeHeight;
				}

				if (borderDir === "bottom") {
					startY = yCoord + mapData.nodeHeight;
					endY = startY;
				}

				if (borderDir === "right") {
					startX = xCoord + mapData.nodeWidth;
					endX = startX;
					endY = yCoord + mapData.nodeHeight;
				}

				const l = new fabric.Line([startX, startY, endX, endY], {
					stroke: "#333",
					strokeWidth: 2,
					hasControls: false,
				});

				this.canvas.add(l);
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
				stroke: "#333",
				strokeWidth: 1,
				hasControls: false,
			});

			this.canvas.add(l);
		}
		for (c = 0; c < mapData.gridHeight; c++) {
			const startX = 0;
			const startY = c * mapData.nodeHeight;
			const endX = 300;
			const endY = startY;

			const l = new fabric.Line([startX, startY, endX, endY], {
				stroke: "#333",
				strokeWidth: 1,
				hasControls: false,
			});

			this.canvas.add(l);
		}
	}
}

export default CanvasMap;
