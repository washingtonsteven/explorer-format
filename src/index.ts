import Story from "./Story";

interface ExplorerGlobal {
	__explorer: {
		story: Story;
	};
}

type WindowWithExplorerGlobal = typeof window & ExplorerGlobal;

const STORY_READY_EVENT = "explorer:storyready";

(() => {
	// Initialize story data
	const rootStoryDataNode =
		document.querySelector<HTMLElement>("tw-storydata");
	if (!rootStoryDataNode) {
		throw new Error(`Missing tw-storydata node!`);
	}
	const story = new Story(rootStoryDataNode);

	// user script and style
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

	// helper func to navigate to a passage
	const navigateToPassageName = (
		passageName: string,
		passageContainer: HTMLElement,
		buttonContainer?: HTMLElement | null,
		directionalsContainer?: HTMLElement | null
	) => {
		const passage = story.getPassageByName(passageName);
		if (!passage) {
			throw new Error(
				`Couldn't find passage with name: "${passageName}"!`
			);
		}
		story.displayPassage(
			passage,
			passageContainer,
			buttonContainer,
			directionalsContainer
		);
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

	const buttonContainer = document.querySelector<HTMLElement>("#buttons");

	const directionalsContainer =
		document.querySelector<HTMLElement>("#directionals");

	const handleButtonLink = (event: Event) => {
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
				buttonContainer,
				directionalsContainer
			);
		}
	};

	if (buttonContainer) {
		buttonContainer.addEventListener("click", handleButtonLink);
	}

	if (directionalsContainer) {
		directionalsContainer.addEventListener("click", handleButtonLink);
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
			navigateToPassageName(
				passageName,
				passageContainer,
				buttonContainer,
				directionalsContainer
			);
		}
	});

	document.addEventListener("keypress", (e) => {
		if (e.key === "m") {
			// mute audio
			story.renderer.audioHelper.toggleMuteAll();
		}
	});

	// Let's make the story accessible
	(window as WindowWithExplorerGlobal).__explorer = {
		story,
	};

	// Let's go!
	story.displayCurrentPassage(
		passageContainer,
		buttonContainer,
		directionalsContainer
	);

	const loadingCover = document.querySelector("#loading-cover");
	if (loadingCover) {
		setTimeout(() => {
			loadingCover.classList.add("loaded");
			document.dispatchEvent(new CustomEvent(STORY_READY_EVENT));
		}, 2500);
	}
})();
