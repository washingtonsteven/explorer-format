import CanvasMap from "./CanvasMap";
import Story from "./Story";

type ExplorerGlobal = {
	__explorer: {
		story: Story;
	};
};

type WindowWithExplorerGlobal = typeof window & ExplorerGlobal;

(() => {
	// Initialize story data
	const rootStoryDataNode =
		document.querySelector<HTMLElement>("tw-storydata");
	if (!rootStoryDataNode) {
		throw new Error(`Missing tw-storydata node!`);
	}
	const story = new Story(rootStoryDataNode);

	// Find story DOM
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

	// Handle link clicks
	storyContainer.addEventListener("click", (event) => {
		if (!event.target) {
			return;
		}

		const target = event.target as HTMLElement;

		if (
			target.tagName.toLowerCase() === "a" &&
			target.dataset.passageName
		) {
			const passageName = target.dataset.passageName;
			const passage = story.getPassageByName(passageName);
			if (!passage) {
				throw new Error(
					`Couldn't find passage with name: "${passageName}"!`
				);
			}
			story.displayPassage(passage, passageContainer);
		}
	});

	// Let's make the story accessible
	(window as WindowWithExplorerGlobal).__explorer = {
		story,
	};

	// Let's go!
	story.displayCurrentPassage(passageContainer);

	new CanvasMap();
})();
