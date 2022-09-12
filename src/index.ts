import CanvasMap from "./CanvasMap";
import Story from "./Story";

interface ExplorerGlobal {
	__explorer: {
		story: Story;
	};
}

type WindowWithExplorerGlobal = typeof window & ExplorerGlobal;

(() => {
	// Initialize story data
	const rootStoryDataNode =
		document.querySelector<HTMLElement>("tw-storydata");
	if (!rootStoryDataNode) {
		throw new Error(`Missing tw-storydata node!`);
	}
	const story = new Story(rootStoryDataNode);

	const userScript = rootStoryDataNode.querySelector(
		"script#twine-user-script"
	);
	if (userScript) {
		const scriptElem = document.createElement("script");
		scriptElem.setAttribute("type", "text/javascript");
		scriptElem.classList.add("user-script");
		scriptElem.innerHTML = userScript.innerHTML;
		document.body.appendChild(scriptElem);
	}

	const userStyle = rootStoryDataNode.querySelector(
		"style#twine-user-stylesheet"
	);
	if (userStyle) {
		const styleElem = document.createElement("style");
		styleElem.setAttribute("type", "text/css");
		styleElem.classList.add("user-style");
		styleElem.innerHTML = userStyle.innerHTML;
		document.head.appendChild(styleElem);
	}

	const navigateToPassageName = (
		passageName: string,
		passageContainer: HTMLElement,
		titleNode?: HTMLElement | null,
		inputNode?: HTMLElement
	) => {
		const passage = story.getPassageByName(passageName);
		if (!passage) {
			throw new Error(
				`Couldn't find passage with name: "${passageName}"!`
			);
		}
		story.displayPassage(passage, passageContainer, titleNode, inputNode);
	};

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

	const inputContainer = document.querySelector<HTMLElement>("#tw-input");
	if (!inputContainer) {
		throw new Error(`Missing input container #tw-input`);
	}

	const titleNode =
		passageContainer.parentNode?.querySelector<HTMLElement>(".titlebar");

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
			navigateToPassageName(
				passageName,
				passageContainer,
				titleNode,
				inputContainer
			);
		}
	});

	if (inputContainer) {
		// Handle input button clicks
		inputContainer.addEventListener("click", (event) => {
			if (!event.target) {
				return;
			}

			const target = event.target as HTMLElement;

			if (
				target.tagName.toLowerCase() === "button" &&
				target.dataset.passageName
			) {
				const passageName = target.dataset.passageName;
				navigateToPassageName(
					passageName,
					passageContainer,
					titleNode,
					inputContainer
				);
			}
		});
	}

	// Let's make the story accessible
	(window as WindowWithExplorerGlobal).__explorer = {
		story,
	};

	// Let's go!
	story.displayCurrentPassage(passageContainer, titleNode, inputContainer);
})();
