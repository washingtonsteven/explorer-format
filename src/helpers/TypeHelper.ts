/**
 *
 */

import NodeTyper from "../NodeTyper";
import { uuid } from "../util";

class TypeHelper {
	text: string;
	speed: number;
	delay: number;
	name?: string;
	wait?: boolean = false;
	parentNode: HTMLElement;
	typerNodeId: string;
	typer: NodeTyper;
	isTyping: boolean = false;
	typingComplete: boolean = false;
	typeInterval: number;
	typeDelayTimeout: number;
	onComplete?: Function;

	constructor(
		text: string,
		speed: number = 40,
		delay: number = 0,
		name?: string,
		wait?: boolean,
		onComplete?: Function
	) {
		this.text = text;
		this.speed = speed;
		this.delay = delay;
		this.name = name;
		this.wait = wait;
		this.onComplete = onComplete;

		this.parentNode = document.createElement("span");
		this.typerNodeId = `typer-${name ? `${name}-` : ""}${uuid()}`;
		this.parentNode.setAttribute("id", this.typerNodeId);
		this.parentNode.classList.add("typer");
		this.parentNode.dataset.typerName = String(this.name);
		this.parentNode.innerHTML = text;

		this.typer = new NodeTyper(this.parentNode);

		this.finish = this.finish.bind(this);

		document.addEventListener("keypress", this.finish);

		if (!wait) {
			this.start();
		}
	}

	output() {
		return this.parentNode.outerHTML;
	}

	start() {
		if (this.isTyping || this.typingComplete || this.typeDelayTimeout) {
			console.warn(`Tried to restart typing for ${this.typerNodeId}`);
			return;
		}
		this.typeDelayTimeout = setTimeout(() => {
			this.parentNode.classList.add("typing");
			this.isTyping = true;
			this.typeInterval = setInterval(() => {
				const res = this.typer.type();
				if (!res) {
					clearInterval(this.typeInterval);
					this.parentNode.classList.remove("typing");
					this.parentNode.classList.add("typed");
					this.isTyping = false;
					this.typingComplete = true;

					if (this.onComplete) {
						this.onComplete();
					}
				}
				const n = document.querySelector(`#${this.typerNodeId}`);
				if (n) {
					n.outerHTML = this.parentNode.outerHTML;
				}
			}, this.speed);
		}, this.delay);
	}

	finish(e: KeyboardEvent) {
		if (e.code !== "Space" || !this.isTyping) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		clearTimeout(this.typeDelayTimeout);
		this.typer.finish(); // The next interval will run and clear itself, handling normal onComplete things

		document.removeEventListener("keypress", this.finish);
	}
}

export default TypeHelper;
