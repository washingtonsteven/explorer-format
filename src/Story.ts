import Passage from "./Passage";
import State from "./State";
import HandlebarsRenderer from "./HandlebarsRenderer";
import CanvasMap, { type CanvasMapDefaultData } from "./CanvasMap";

const CURRENT_PASSAGE_PID_STATEKEY = "currentPassagePid";
const LAST_PASSAGE_PID_STATEKEY = "lastPassagePid";
export const MAP_DISPLAYED_STATEKEY = "mapDisplayed";

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
	canvasMap: CanvasMap;

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
		this.canvasMap = new CanvasMap();

		const passages: Passage[] = [];
		const passageNodes =
			storyDataNode.querySelectorAll<HTMLElement>("tw-passagedata");

		Array.from(passageNodes).forEach((node) => {
			const passage = new Passage(node);

			if (passage.name === "MapDefaults") {
				let defaultData: CanvasMapDefaultData;
				try {
					defaultData = JSON.parse(passage.rawContent);
					this.canvasMap.setDefaultMapData(defaultData);
				} catch (e) {
					throw new Error(`Malformed default map data!`);
				}
			}

			if (passage.tags.includes("map")) {
				this.canvasMap.addMap({
					map: passage.rawContent,
					name: passage.name,
				});
			}

			passages.push(passage);
		});

		this.passages = passages;

		this.state = new State({
			[CURRENT_PASSAGE_PID_STATEKEY]: startnode,
			[LAST_PASSAGE_PID_STATEKEY]: null,
			[MAP_DISPLAYED_STATEKEY]: false,
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

	displayPassage(
		passageOrPid: string | Passage,
		passageNode: HTMLElement,
		titleNode?: HTMLElement | null,
		inputNode?: HTMLElement
	) {
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

		this.state.set(MAP_DISPLAYED_STATEKEY, false);

		this.state.set(
			LAST_PASSAGE_PID_STATEKEY,
			this.state.get(CURRENT_PASSAGE_PID_STATEKEY)
		);
		this.state.set(CURRENT_PASSAGE_PID_STATEKEY, passage.pid);

		const passageContent = this.renderer.render(passage.richContent);

		passageNode.classList.remove("run-anim");
		passageNode.innerHTML = "";
		setTimeout(() => {
			passageNode.classList.add("run-anim");
			passageNode.innerHTML = passageContent;
		}, 1);

		if (!this.state.get(MAP_DISPLAYED_STATEKEY)) {
			this.canvasMap.clear();
		}

		if (titleNode) {
			titleNode.innerHTML = passage.name;
		}

		if (inputNode) {
			const buttonContainer = inputNode.querySelector(".buttons");
			const directionalContainer =
				inputNode.querySelector(".directionals");
			if (buttonContainer) {
				buttonContainer.innerHTML = "";

				const linkList = [...passage.links];

				if (!linkList.length) {
					// hack to make sure the button container isn't less than one button tall
					linkList.push({ alias: "empty", passageName: "empty" });
				}

				linkList.forEach((link) => {
					const button = document.createElement("button");
					button.innerHTML = link.alias;
					button.dataset.passageName = link.passageName;
					buttonContainer.appendChild(button);
				});

				if (directionalContainer) {
					const directionalButtons = [
						...directionalContainer.querySelectorAll("button"),
					];
					directionalButtons.forEach((button) => {
						button.disabled = true;
						button.dataset.passageName = "";
					});

					if (passage.directionalLinks) {
						passage.directionalLinks.forEach((link) => {
							const button = directionalButtons.find((b) => {
								return b.classList.contains(
									link.alias.toLowerCase()
								);
							});

							if (button) {
								button.disabled = false;
								button.dataset.passageName = link.passageName;
							} else {
								console.warn(
									`Tried to set up a directional called ${link.alias.toLowerCase()}, but that button wasn't found.`
								);
							}
						});
					}
				}
			}
		}
	}

	displayCurrentPassage(
		passageNode: HTMLElement,
		titleNode?: HTMLElement | null,
		inputNode?: HTMLElement
	) {
		this.displayPassage(
			this.currentPassage,
			passageNode,
			titleNode,
			inputNode
		);
	}
}

export default Story;
