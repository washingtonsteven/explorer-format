import Handlebars from "handlebars";
import { HighlightPoint } from "./CanvasMap";
import type Story from "./Story";
import { MAP_DISPLAYED_STATEKEY } from "./Story";
import { unescape } from "./util";

class HandlebarsRenderer {
	story: Story;

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
				eval(scriptContent);
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
			const text: string = options.fn(); // So far, this doesn't support markup in the typed text, even formatting like bold and stuff.

			const textNodes = text.split("").map((char, i) => {
				const span = document.createElement("span");
				span.innerHTML = char;
				span.style.opacity = "0";
				span.style.animationDuration = "1ms";
				span.style.animationDelay = `${delay + i * speed}ms`;
				span.style.animationName = "appear";
				span.style.animationFillMode = "both";

				return span;
			});

			return textNodes.map((n) => n.outerHTML).join("");
		});
	}

	render(content: string) {
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
