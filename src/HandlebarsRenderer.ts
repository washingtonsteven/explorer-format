import Handlebars from "handlebars";
import type Story from "./Story";

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
	}

	render(content: string) {
		const template = Handlebars.compile(content);

		return template(this.story.state.store);
	}
}

export default HandlebarsRenderer;
