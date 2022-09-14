class AudioWrapper {
	name: string;
	audio: HTMLAudioElement;
	canplaythrough: boolean;
	played: boolean;
	playOnLoad: boolean;

	constructor(
		name: string,
		audio: HTMLAudioElement,
		canplaythrough: boolean,
		played: boolean,
		playOnLoad: boolean
	) {
		this.name = name;
		this.audio = audio;
		this.canplaythrough = canplaythrough;
		this.played = played;
		this.playOnLoad = playOnLoad;
	}

	get playing() {
		return !this.audio.paused;
	}
}

class AudioHelper {
	audioWrappers: AudioWrapper[] = [];
	masterVolume: number = 1;

	add(audioUrl: string, name: string) {
		const audio = new Audio(audioUrl);
		let canplaythrough = false;
		if (audio.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
			canplaythrough = true;
		} else {
			audio.addEventListener("canplaythrough", () => {
				const audioWrapper = this.getAudioWrapperByName(name);
				if (audioWrapper) {
					audioWrapper.canplaythrough = true;
					if (audioWrapper.playOnLoad) {
						console.log(`${name} loaded: playing delayed`);
						audioWrapper.audio.play();
					}
				}
			});
		}

		audio.setAttribute("preload", "auto");

		// TODO: other audio events? "play", "pause", etc.

		audio.addEventListener("ended", () => {
			const audioWrapper = this.getAudioWrapperByName(name);
			if (audioWrapper) {
				audioWrapper.played = true;
			}
		});

		this.audioWrappers.push(
			new AudioWrapper(name, audio, canplaythrough, false, false)
		);
	}

	getAudioByName(name: string) {
		const audioWrapper = this.getAudioWrapperByName(name);
		if (audioWrapper) {
			return audioWrapper.audio;
		}

		return null;
	}

	getAudioWrapperByName(name: string) {
		return this.audioWrappers.find((wrapper) => wrapper.name === name);
	}

	playAudio(
		name: string,
		loop: boolean = false,
		volume: number = 1
	): boolean {
		const audioWrapper = this.getAudioWrapperByName(name);
		if (audioWrapper) {
			audioWrapper.audio.loop = loop;
			audioWrapper.audio.volume = volume * this.masterVolume;
			if (!audioWrapper.canplaythrough) {
				console.log(`Need to wait for ${name} to load.`);
				audioWrapper.playOnLoad = true;
			} else {
				audioWrapper.audio.play();
			}
			return true;
		}

		return false;
	}

	pauseAudio(name: string) {
		const audioWrapper = this.getAudioWrapperByName(name);
		if (audioWrapper) {
			audioWrapper.audio.pause();
		}
	}

	toggleMuteAll() {
		this.audioWrappers.forEach((audioWrapper) => {
			audioWrapper.audio.muted = !audioWrapper.audio.muted;
		});
	}

	stopAll() {
		this.audioWrappers.forEach((audioWrapper) => {
			audioWrapper.audio.pause();
			audioWrapper.audio.currentTime = 0;
		});
	}
}

export default AudioHelper;
