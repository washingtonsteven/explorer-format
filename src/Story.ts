class Story {
	name: string;
	ifid: string;
	format: string | null;
	formatVersion: string | null;
	startnode: string | null;
	zoom: string | null;
	creator: string | null;
	creatorVersion: string | null;
	passages: Passage[];
	currentPassagePid: string;

	constructor(storyDataNode: HTMLElement) {
		const name = storyDataNode.getAttribute("name");
		const ifid = storyDataNode.getAttribute("ifid");
		const startnode = storyDataNode.getAttribute("startnode");

		if (!name) {
			throw new Error("Story is missing a name!");
		}

		if (!ifid) {
			throw new Error(`Story is missing an ifid!`);
		}

		if (!startnode) {
			throw new Error(`No startnode specified!`);
		}

		this.name = name;
		this.ifid = ifid;
		this.startnode = startnode;
		this.format = storyDataNode.getAttribute("format");
		this.formatVersion = storyDataNode.getAttribute("format-version");
		this.zoom = storyDataNode.getAttribute("zoom");
		this.creator = storyDataNode.getAttribute("creator");
		this.creatorVersion = storyDataNode.getAttribute("creator-version");

		const passages: Passage[] = [];
		const passageNodes =
			storyDataNode.querySelectorAll<HTMLElement>("tw-passagedata");

		Array.from(passageNodes).forEach((node) => {
			passages.push(new Passage(node));
		});

		this.passages = passages;
		this.currentPassagePid = startnode;
	}

	get currentPassage() {
		const currentPassage = this.getPassageByPid(this.currentPassagePid);
		if (!currentPassage) {
			throw new Error(
				`Tried to fetch currentPassage but it doesn't exist!`
			);
		}

		return currentPassage;
	}

	getPassageByPid(pid: string) {
		return this.passages.find((passage) => passage.pid === pid) || null;
	}

	displayPassage(passageOrPid: string | Passage, node: HTMLElement) {
		let passage: Passage;
		if (typeof passageOrPid === "string") {
			const foundPassage = this.getPassageByPid(passageOrPid);
			if (!foundPassage) {
				throw new Error(
					`Tried to display passage with pid: ${passageOrPid}, but it doesn't exist!`
				);
			}
			passage = foundPassage;
		} else {
			passage = passageOrPid;
		}

		node.innerHTML = passage.content;
	}

	displayCurrentPassage(node: HTMLElement) {
		this.displayPassage(this.currentPassage, node);
	}
}
