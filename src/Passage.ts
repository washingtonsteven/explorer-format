class Passage {
	pid: string;
	name: string;
	content: string;
	tags: string[];
	position: { x: number; y: number };
	size: { width: number; height: number };

	constructor(passageNode: HTMLElement) {
		const pid = passageNode.getAttribute("pid");
		const name = passageNode.getAttribute("name");

		if (!pid) {
			throw new Error(`A passage (name: ${name}) is missing a pid!`);
		}
		if (!name) {
			throw new Error(`A passage with pid ${pid} is missing a name!`);
		}

		const tagsRaw = passageNode.getAttribute("tags");
		const positionRaw = passageNode.getAttribute("position");
		const sizeRaw = passageNode.getAttribute("size");
		const content = passageNode.innerHTML;

		const tags = tagsRaw?.split(" ") || [];
		const position = { x: 0, y: 0 };
		if (positionRaw) {
			const positionCoords = positionRaw
				.split(",")
				.map((n) => parseFloat(n));
			position.x = positionCoords[0];
			position.y = positionCoords[1];
		}
		const size = { width: 100, height: 100 };
		if (sizeRaw) {
			const dims = sizeRaw.split(",").map((n) => parseFloat(n));
			size.width = dims[0];
			size.height = dims[1];
		}

		this.pid = pid;
		this.name = name;
		this.tags = tags;
		this.position = position;
		this.size = size;
		this.content = content;
	}
}
