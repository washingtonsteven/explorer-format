import { marked } from "marked";
import {
	fixHandlebarsAttributeQuotes,
	convertLinks,
	unescape,
	extractLinks,
} from "./util";

export type Link = {
	passageName: string;
	alias: string;
};

class Passage {
	pid: string;
	name: string;
	rawContent: string;
	rawContentWithoutLinks: string;
	tags: string[];
	position: { x: number; y: number };
	size: { width: number; height: number };
	links: Link[];

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
		this.rawContent = content;
		const { links, content: contentWithoutLinks } = extractLinks(content);
		this.rawContentWithoutLinks = contentWithoutLinks;
		this.links = links;
	}

	get richContent() {
		// const linksParsed = convertLinks(this.rawContentWithoutLinks);
		const unescaped = unescape(this.rawContentWithoutLinks);
		const html = marked.parse(unescaped);

		return fixHandlebarsAttributeQuotes(html);
	}
}

export default Passage;
