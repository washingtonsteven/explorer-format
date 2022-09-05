type GlobalState = Record<string, unknown>;
type TempState = Record<string, unknown>;
type StateListener = (globalState: GlobalState, tempState: TempState) => void;
type CombinedStateObject = {
	[k: string]: unknown;
	temp: TempState;
	t?: TempState;
};

class State {
	globalState: GlobalState;
	tempState: TempState;
	listeners: StateListener[];

	constructor(
		initialGlobalState: GlobalState = {},
		initialTempState: TempState = {}
	) {
		this.globalState = initialGlobalState;
		this.tempState = initialTempState;
		this.listeners = [];
	}

	addListener(listener: StateListener) {
		this.listeners.push(listener);
	}

	callListeners() {
		this.listeners.forEach((listener) => {
			listener(this.globalState, this.tempState);
		});
	}

	/**
	 * Gets a key from the state.
	 * Said key can be a dot-delimited string to drill through the state object.
	 * i.e. "parent.child.grandchild" will fetch the "foo" from global state: { parent: { child: { grandchild: "foo" } } }
	 * prefix your key with "t." or "temp." to automatically fetch from the tempState without setting the second arg
	 * i.e. "t.myTempVar" will get "myTempVar" from the tempState
	 * this also means that "t" and "temp" are mostly inaccessible keys in global state. Careful.
	 */
	get(key: string, isTemp = false) {
		const parts = key.split(".");
		const useTempState = isTemp || parts[0] === "temp" || parts[0] === "t";
		let stateObj = this.globalState;

		if (useTempState) {
			if (parts[0] === "temp" || parts[0] === "t") {
				return this.get(parts.slice(1).join("."));
			}
			stateObj = this.tempState;
		}

		return parts.reduce((last: any, partialKey) => {
			if (Object.prototype.hasOwnProperty.call(last, partialKey)) {
				return last[partialKey];
			} else {
				throw new Error(`Unable to get variable with key ${key}`);
			}
		}, stateObj);
	}

	set(key: string, value: any, isTemp = false) {
		if (isTemp) {
			this.tempState[key] = value;
		} else {
			this.globalState[key] = value;
		}

		this.callListeners();
	}

	setTemp(key: string, value: any) {
		this.set(key, value, true);
	}

	clear(key: string | null, isTemp = false) {
		if (!key) {
			if (isTemp) {
				this.tempState = {};
			} else {
				this.globalState = {};
			}
		} else {
			if (isTemp) {
				delete this.tempState[key];
			} else {
				delete this.globalState[key];
			}
		}

		this.callListeners();
	}

	get combinedStateObject() {
		const obj: CombinedStateObject = {
			...this.globalState,
			temp: {
				...this.tempState,
			},
		};

		obj.t = obj.temp;

		return obj;
	}
}

export default State;

export const initializeFromCombinedStateObject = (
	combinedStateObject: CombinedStateObject
) => {
	const tempState: TempState = { ...combinedStateObject.temp };
	const globalState: GlobalState = { ...combinedStateObject };

	if (Object.prototype.hasOwnProperty.call(globalState, "temp")) {
		delete globalState.temp;
	}

	if (Object.prototype.hasOwnProperty.call(globalState, "t")) {
		delete globalState.t;
	}

	return new State(globalState, tempState);
};
