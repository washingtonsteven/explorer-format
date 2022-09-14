// Concept pretty much taken from TME's NodeTyper in Sugarcube 2: https://github.com/tmedwards/sugarcube-2/blob/27903a854b7bedbb9fa60efa33e47c99bab7a359/src/lib/nodetyper.js
// Which is Copyright (c) 2013-2021, Thomas Michael Edwards <thomasmedwards@gmail.com>. All rights reserved.
// This is going to be less robust but also less jQuery so, who can say which is better (turns out most anyone)

class NodeTyper {
	node: Node;
	appendTarget?: Node | null;
	childNodes: NodeTyper[];
	nodeValue: string;
	finished: boolean;
	constructor(node: Node, appendTarget?: Node) {
		this.node = node;
		this.appendTarget = appendTarget;
		this.childNodes = [];

		if (this.node.nodeValue) {
			this.nodeValue = this.node.nodeValue;
			this.node.nodeValue = "";
		}

		let childNode: ChildNode | null;
		while ((childNode = this.node.firstChild) !== null) {
			this.childNodes.push(new NodeTyper(childNode, node));
			this.node.removeChild(childNode);
		}

		this.finished = false;
	}

	finish() {
		while (this.type()); // type everything
		return false;
	}

	type(flush?: boolean) {
		if (this.finished) {
			return false;
		}

		if (this.appendTarget) {
			this.appendTarget.appendChild(this.node);

			if (
				(this.node.nodeType !== Node.ELEMENT_NODE &&
					this.node.nodeType !== Node.TEXT_NODE) ||
				window.getComputedStyle(this.node.parentNode as HTMLElement)
					.display === "none"
			) {
				return this.finish();
			}

			this.appendTarget = null;
		}

		if (this.nodeValue) {
			if (flush) {
				this.node.nodeValue += this.nodeValue;
				this.nodeValue = "";
			} else {
				// TODO: TME has a func to make this smarter about unicode points, i.e. emoji, etc.
				const char = this.nodeValue.charAt(0);
				this.node.nodeValue += char;
				this.nodeValue = this.nodeValue.slice(1);
			}

			return true;
		}

		while (this.childNodes.length > 0) {
			if (this.childNodes[0].type()) {
				return true;
			}

			this.childNodes.shift();
		}

		this.finished = true;
		return false;
	}
}

export default NodeTyper;
