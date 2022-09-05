import Story from "./Story";

(() => {
	const rootStoryDataNode =
		document.querySelector<HTMLElement>("tw-storydata");
	if (!rootStoryDataNode) {
		throw new Error(`Missing tw-storydata node!`);
	}
	const story = new Story(rootStoryDataNode);

	const storyContainer = document.querySelector("#tw-story");
	if (!storyContainer) {
		throw new Error(`Missing story container #tw-story!`);
	}

	const passageContainer = storyContainer.querySelector<HTMLElement>(
		"#tw-story #tw-passage"
	);
	if (!passageContainer) {
		throw new Error(`Missing passage container #tw-passage`);
	}

	story.displayCurrentPassage(passageContainer);
})();
