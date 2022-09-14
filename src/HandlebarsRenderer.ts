import Handlebars from "handlebars";
import { HighlightPoint } from "./CanvasMap";
import type Story from "./Story";
import { MAP_DISPLAYED_STATEKEY } from "./Story";
import { unescape, uuid } from "./util";
import TypeHelper from "./helpers/TypeHelper";
import AudioHelper from "./helpers/AudioHelper";

class HandlebarsRenderer {
	story: Story;
	typeHelpers: TypeHelper[] = [];
	audioHelper: AudioHelper;

	constructor(story: Story) {
		this.story = story;

		Handlebars.registerHelper("set", (options) => {
			Object.keys(options.hash).forEach((key) => {
				let value;
				try {
					value = JSON.parse(options.hash[key]);
				} catch (e) {
					value = options.hash[key];
				}

				this.story.state.set(key, value);
			});
		});

		Handlebars.registerHelper("script", (options) => {
			const scriptContent = unescape(options.fn());
			(function () {
				try {
					eval(scriptContent);
				} catch (e) {
					console.warn(`error evaluating ${scriptContent}`);
					throw e;
				}
			}.call(this.getScriptContext()));
		});

		Handlebars.registerHelper("display_map", (options) => {
			const mapName: string = options.hash["name"];
			const highlightCoordString: string = options.hash["highlight"];
			let highlight: HighlightPoint = null;

			if (highlightCoordString) {
				const [xString, yString] = highlightCoordString.split(",");
				const x = parseInt(xString);
				const y = parseInt(yString);

				if (!isNaN(x) && !isNaN(y)) {
					highlight = { x, y };
				}
			}

			this.story.canvasMap.displayMap(mapName, highlight);
			this.story.state.set(MAP_DISPLAYED_STATEKEY, true);
		});

		Handlebars.registerHelper("type", (options) => {
			const speed: number = parseInt(options.hash["speed"]) || 40;
			const delay: number = parseInt(options.hash["delay"]) || 0;
			const next: string =
				options.hash["next"] && String(options.hash["next"]);
			const name: string =
				options.hash["name"] && String(options.hash["name"]);
			const wait: boolean = Boolean(options.hash["wait"]);
			const text: string = options.fn();

			const onComplete = () => {
				if (!next) return;

				const nextTyper = this.typeHelpers.find((t) => {
					return t.name === next;
				});

				if (nextTyper) {
					nextTyper.start();
				}
			};

			const typeHelper = new TypeHelper(
				text,
				speed,
				delay,
				name,
				wait,
				onComplete
			);

			this.typeHelpers.push(typeHelper);

			return typeHelper.output();
		});

		Handlebars.registerHelper("audio", (options) => {
			// TODO: limit this to a setup passage
			const url = options.hash["url"] || "";
			const name = options.hash["name"] || "";

			if (!url) {
				// TODO: Other checks to make sure its a url?
				throw new Error(
					`Tried to load audio at ${url} but it doesn't seem valid.`
				);
			}

			if (!name) {
				throw new Error(
					`Provided an {{#audio}} macro with no name. Name is required.`
				);
			}

			if (!this.audioHelper) {
				this.audioHelper = new AudioHelper();
			}

			this.audioHelper.add(url, name);
		});

		Handlebars.registerHelper("playaudio", (options) => {
			const name = options.hash["name"] || "";
			const loop = Boolean(options.hash["loop"]);
			if (!name) {
				throw new Error(
					`Provided a {{#playaudio}} macro with no name. Name is required.`
				);
			}
			if (!this.audioHelper) {
				throw new Error(
					`AudioHelper not initialized, did you call {{#audio}} already?`
				);
			}

			this.audioHelper.playAudio(name, loop);
		});
	}

	resetHelperState() {
		this.typeHelpers = [];
	}

	render(content: string) {
		this.resetHelperState();
		const template = Handlebars.compile(content);

		return template(this.story.state.store);
	}

	getScriptContext() {
		const story = this.story;
		const set = (key: string, value: any) =>
			this.story.state.set(key, value);
		const get = (key: string) => this.story.state.get(key);
		const passage = this.story.currentPassage;

		return {
			story,
			get,
			set,
			passage,
		};
	}
}

export default HandlebarsRenderer;
