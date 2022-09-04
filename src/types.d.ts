interface StoryData {
	name: string;
	ifid: string;
	format?: string | null;
	formatVersion?: string | null;
	startnode?: string | null;
	zoom?: string | null;
	creator?: string | null;
	creatorVersion?: string | null;
	passages: Passage[];
	currentPassagePid: Pid;
}

type Pid = string;

interface Passage {
	pid: Pid;
	name: string;
	tags?: string[];
	position: {
		x: number;
		y: number;
	};
	size: {
		width: number;
		height: number;
	};
	content: string;
}
