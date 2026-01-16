export class AudioPlayer {
    private audioContext: AudioContext | undefined;
    private isPlaying: boolean = false;

    constructor() {
        // AudioContext is initialized lazily to comply with browser autoplay policies
    }

    public init(): void {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            console.log("[AudioPlayer] Initialized AudioContext");
        }
    }

    public async resume(): Promise<void> {
        this.init();
        if (this.audioContext && this.audioContext.state === "suspended") {
            await this.audioContext.resume();
            console.log("[AudioPlayer] AudioContext resumed");
        }
    }

    public play(): void {
        this.resume();
        this.isPlaying = true;
        console.log("[AudioPlayer] Play");
    }

    public stop(): void {
        this.isPlaying = false;
        console.log("[AudioPlayer] Stop");
    }

    public get state(): AudioContextState {
        return this.audioContext ? this.audioContext.state : "closed";
    }

    // Temporary test method
    public testSound(): void {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        oscillator.connect(this.audioContext.destination);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5); // 0.5s beep
    }
}
