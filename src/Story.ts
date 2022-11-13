import Passage from "./Passage";
import State from "./State";
import HandlebarsRenderer from "./HandlebarsRenderer";
import CanvasMap, { type CanvasMapDefaultData } from "./CanvasMap";

const CURRENT_PASSAGE_PID_STATEKEY = "currentPassagePid";
const LAST_PASSAGE_PID_STATEKEY = "lastPassagePid";
export const MAP_DISPLAYED_STATEKEY = "mapDisplayed";

export const PASSAGE_CHANGED_EVENT = "explorer:passagechanged";

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
		this.renderer = new HandlebarsRenderer(this);

		this.state = new State({
			[CURRENT_PASSAGE_PID_STATEKEY]: startnode,
			[LAST_PASSAGE_PID_STATEKEY]: null,
			[MAP_DISPLAYED_STATEKEY]: false,
		});

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

			if (passage.name === "StorySetup") {
				// run macros in the setup passage
				// use rawContent since we aren't worrying about links or anything
				this.renderer.render(passage.rawContent);
			}

			passages.push(passage);
		});

		this.passages = passages;
	}

	get currentPassage() {
		const currentPassage = this.getPassageByPid(
			this.state.get(CURRENT_PASSAGE_PID_STATEKEY)
		);
		if (!currentPassage && this.passages) {
			throw new Error(
				`Tried to fetch currentPassage but it doesn't exist!`
			);
		}

		return currentPassage;
	}

	getPassageByPid(pid: string) {
		if (!this.passages) return null;
		return this.passages.find((passage) => passage.pid === pid) || null;
	}

	getPassageByName(name: string) {
		if (!this.passages) return null;
		return this.passages.find((passage) => passage.name === name) || null;
	}

	displayPassage(
		passageOrPid: string | Passage,
		passageNode: HTMLElement,
		buttonContainer?: HTMLElement | null,
		directionalsContainer?: HTMLElement | null
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
		const passageContainer = document.createElement("div");
		passageContainer.classList.add(
			"passage-container",
			...(passage.tags || [])
		);
		passageContainer.innerHTML = passageContent;

		// passageNode.classList.remove("run-anim");
		// passageNode.innerHTML = "";
		setTimeout(() => {
			// passageNode.classList.add("run-anim");
			// passageNode.innerHTML = passageContent;
			passageNode.appendChild(passageContainer);
			passageContainer.scrollIntoView({
				block: "start",
				inline: "nearest",
				behavior: "smooth",
			});

			const activePassageContainer = passageNode.querySelector(
				".passage-container.active"
			);
			if (activePassageContainer) {
				activePassageContainer.classList.remove("active");
			}
			passageContainer.classList.add("active");
		}, 1);

		if (!this.state.get(MAP_DISPLAYED_STATEKEY)) {
			this.canvasMap.clear();
		}

		if (buttonContainer) {
			buttonContainer.innerHTML = "";

			const linkList = [...passage.links];

			if (!linkList.length) {
				buttonContainer.classList.add("empty");
			} else {
				buttonContainer.classList.remove("empty");
			}

			linkList.forEach((link) => {
				const button = document.createElement("button");
				button.innerHTML = link.alias;
				button.dataset.passageName = link.passageName;
				buttonContainer.appendChild(button);
			});
		}

		if (directionalsContainer) {
			const directionalButtons = [
				...directionalsContainer.querySelectorAll("button"),
			];
			directionalButtons.forEach((button) => {
				button.disabled = true;
				button.dataset.passageName = "";
			});

			if (passage.directionalLinks) {
				passage.directionalLinks.forEach((link) => {
					const button = directionalButtons.find((b) => {
						return b.classList.contains(link.alias.toLowerCase());
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

		document.dispatchEvent(
			new CustomEvent(PASSAGE_CHANGED_EVENT, {
				detail: {
					passage,
				},
			})
		);
	}

	displayCurrentPassage(
		passageNode: HTMLElement,
		buttonContainer?: HTMLElement | null,
		directionalsContainer?: HTMLElement | null
	) {
		if (!this.currentPassage) return;

		this.displayPassage(
			this.currentPassage,
			passageNode,
			buttonContainer,
			directionalsContainer
		);
	}
}

export default Story;
