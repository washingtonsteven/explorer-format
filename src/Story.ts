import Passage from "./Passage";
import State from "./State";
import HandlebarsRenderer from "./HandlebarsRenderer";

const CURRENT_PASSAGE_PID_STATEKEY = "currentPassagePid";
const LAST_PASSAGE_PID_STATEKEY = "lastPassagePid";

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
	state: State;
	renderer: HandlebarsRenderer;

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

		this.state = new State({
			[CURRENT_PASSAGE_PID_STATEKEY]: startnode,
			[LAST_PASSAGE_PID_STATEKEY]: null,
		});

		this.renderer = new HandlebarsRenderer(this);
	}

	get currentPassage() {
		const currentPassage = this.getPassageByPid(
			this.state.get(CURRENT_PASSAGE_PID_STATEKEY)
		);
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

	getPassageByName(name: string) {
		return this.passages.find((passage) => passage.name === name) || null;
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

		this.state.set(
			LAST_PASSAGE_PID_STATEKEY,
			this.state.get(CURRENT_PASSAGE_PID_STATEKEY)
		);
		this.state.set(CURRENT_PASSAGE_PID_STATEKEY, passage.pid);

		const passageContent = this.renderer.render(passage.richContent);

		node.innerHTML = passageContent;
	}

	displayCurrentPassage(node: HTMLElement) {
		this.displayPassage(this.currentPassage, node);
	}
}

export default Story;
