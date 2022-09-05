type GlobalState = Record<string, unknown>;
type StateListener = (globalState: GlobalState) => void;

class State {
	store: GlobalState;
	listeners: StateListener[];

	constructor(initialGlobalState: GlobalState = {}) {
		this.store = initialGlobalState;
		this.listeners = [];
	}

	addListener(listener: StateListener) {
		this.listeners.push(listener);
	}

	callListeners() {
		this.listeners.forEach((listener) => {
			listener(this.store);
		});
	}

	/**
	 * Gets a key from the state.
	 * Said key can be a dot-delimited string to drill through the state object.
	 * i.e. "parent.child.grandchild" will fetch the "foo" from global state: { parent: { child: { grandchild: "foo" } } }
	 */
	get(key: string) {
		const parts = key.split(".");

		return parts.reduce((last: any, partialKey) => {
			if (Object.prototype.hasOwnProperty.call(last, partialKey)) {
				return last[partialKey];
			} else {
				throw new Error(`Unable to get variable with key ${key}`);
			}
		}, this.store);
	}

	set(key: string, value: any) {
		this.store[key] = value;

		this.callListeners();
	}

	clear(key: string | null) {
		if (!key) {
			this.store = {};
		} else {
			delete this.store[key];
		}

		this.callListeners();
	}
}

export default State;
