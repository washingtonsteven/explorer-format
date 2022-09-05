import Handlebars from "handlebars";
import type Story from "./Story";
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
