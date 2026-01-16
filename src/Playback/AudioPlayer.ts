import { MusicSheet } from "../MusicalScore/MusicSheet";
import { Note } from "../MusicalScore/VoiceData/Note";
import { Fraction } from "../Common/DataObjects/Fraction";

interface AudioEvent {
    type: "note";
    time: number; // Seconds
    duration: number; // Seconds
    pitch: number; // MIDI or Hz
    note: Note;
}

export class AudioPlayer {
    private audioContext: AudioContext | undefined;
    private isPlaying: boolean = false;
    private events: AudioEvent[] = [];
    private nextEventIndex: number = 0;
    private schedulerInterval: number | null = null;
    private startTime: number = 0;

    constructor() {
        // AudioContext is initialized lazily
    }

    public init(): void {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    public async resume(): Promise<void> {
        this.init();
        if (this.audioContext && this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }
    }

    public loadScore(sheet: MusicSheet): void {
        this.events = [];
        let currentBpm = 120;
        let currentTime = 0; // Seconds
        let currentMeasureStartBeat = new Fraction(0, 1); // Absolute Beats

        // Simple linear processing (ignoring repeats for MVP)
        for (const measure of sheet.sourceMeasures) {
            const beatToSeconds = (beats: number) => (beats * 60) / currentBpm;

            // 1. Process Tempos in this measure
            // For MVP: Check initial tempo (timestamp 0)
            // Ideally: Sort notes and tempos together.
            if (measure.tempos.length > 0) {
                // Take the last one for simplicity or first? 
                // Assuming tempo at start of measure:
                const t = measure.tempos.find(t => t.timestamp.RealValue === 0);
                if (t) currentBpm = t.bpm;
            }

            // 2. Process Notes
            // We need to group notes by chords or just list them.
            for (const note of measure.notes) {
                if (note.isRest) continue;

                // Calculate time from measure start
                const noteStartBeat = note.timestamp.RealValue;
                const durationBeats = note.length.RealValue;

                // Note: This logic assumes constant tempo within measure for the note's position calculation
                // which is "Time = Beat * (60/BPM)"
                const startTime = currentTime + beatToSeconds(noteStartBeat);
                const duration = beatToSeconds(durationBeats);

                // Pitch to Hz
                // Midi: C4 = 60. A4 = 69. freq = 440 * 2^((m-69)/12)
                // const midi = note.pitch.getHalfTone() + 12; 
                // Mini-OSMD Pitch.getHalfTone() reflects deviation from C0? or other?
                // Let's assume Pitch.fundamentalNote + octave... 
                // Pitch.getHalfTone() returns (octave * 12) + stepValue + alter.
                // Typical MIDI: C4 is 60.
                // If Pitch implements standard, we can verify.

                const freq = note.pitch.Frequency;

                this.events.push({
                    type: "note",
                    time: startTime,
                    duration: duration,
                    pitch: freq,
                    note: note
                });
            }

            // Advance time by measure duration
            // Measure duration is determined by Time Signature or actual notes?
            // Use implicit duration (4/4 = 4 beats? or 1 (whole)?)
            // Mini-OSMD Fraction 1/1 = Whole Note = 4 Quarters.
            // But BPM is usually "Quarter Notes per Minute".
            // So if duration is 1 (Whole), that is 4 beats if Quarter is the unit.

            // Standard BPM is usually based on Quarter note.
            // If note.length = 1/4 (Fraction(1,4)), that is 1 beat.
            // If note.length = 1/1, that is 4 beats.

            // Wait, note.length is Fraction.
            // In MusicXML, duration is relative to divisions.
            // In Mini-OSMD, Fraction is normalized?
            // Usually 1 = Whole Note.

            // So Beats = Fraction.RealValue * 4 (if BPM is per quarter).
            // Let's assume BPM is Quarter Note BPM.

            // Recalculate with Beats = Fraction * 4
            // beatToSeconds = (beats * 60) / BPM
            // startTime = currentTime + (note.timestamp.RealValue * 4 * 60 / currentBpm)

            // Measure Duration:
            // Need logical duration of measure.
            // measure.duration? Not present on SourceMeasure?
            // Calculate from Time Signature? measure.activeTimeSignature?
            // Or just Max(Timestamp + Duration) of notes?

            // For MVP: Let's use Max(Note End Time) within measure to advance current time.
            let maxDuration = 0;
            if (measure.notes.length > 0) {
                maxDuration = Math.max(...measure.notes.map(n => n.timestamp.RealValue + n.length.RealValue));
            } else {
                maxDuration = 4 / 4; // Default 4/4
            }

            currentTime += (maxDuration * 4 * 60) / currentBpm;
        }

        // Sort events just in case
        this.events.sort((a, b) => a.time - b.time);
        console.log(`[AudioPlayer] Loaded ${this.events.length} events. Duration: ${currentTime}s`);
    }

    public play(): void {
        this.resume();
        this.isPlaying = true;
        this.nextEventIndex = 0;
        this.startTime = this.audioContext?.currentTime || 0;

        this.schedulerInterval = window.setInterval(() => this.schedule(), 25);
        console.log("[AudioPlayer] Play");
    }

    public stop(): void {
        this.isPlaying = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        console.log("[AudioPlayer] Stop");
    }

    // ...

    public get state(): AudioContextState {
        return this.audioContext ? this.audioContext.state : "closed";
    }

    private schedule(): void {
        if (!this.audioContext) return;
        const lookahead = 0.1; // 100ms
        const currentTime = this.audioContext.currentTime;

        // Loop through events that are due
        while (this.nextEventIndex < this.events.length) {
            const event = this.events[this.nextEventIndex];
            const eventTime = event.time + this.startTime; // Absolute Audio Context Time

            if (eventTime < currentTime + lookahead) {
                this.playEvent(event, eventTime);
                this.nextEventIndex++;
            } else {
                break;
            }
        }
    }

    private playEvent(event: AudioEvent, time: number): void {
        if (!this.audioContext) return;

        // Piano Synthesis Patch
        // Oscillator 1: Triangle for harmonics (The "Wire")
        const osc1 = this.audioContext.createOscillator();
        osc1.type = "triangle";
        osc1.frequency.value = event.pitch;

        // Oscillator 2: Sine for fundamental body
        const osc2 = this.audioContext.createOscillator();
        osc2.type = "sine";
        osc2.frequency.value = event.pitch;

        // Filter: Lowpass to simulate energy loss/decay of high harmonics
        const filter = this.audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(event.pitch * 6, time); // Start bright
        // Decay brightness quickly
        filter.frequency.exponentialRampToValueAtTime(event.pitch * 1.5, time + 0.5);

        // Amps for blending oscs
        const osc1Gain = this.audioContext.createGain();
        const osc2Gain = this.audioContext.createGain();

        // Osc 1 (Triangle) provides the "attack" bite, simpler decay
        osc1Gain.gain.setValueAtTime(0.4, time);
        osc1Gain.gain.exponentialRampToValueAtTime(0.01, time + 0.8);

        // Osc 2 (Sine) provides the "sustain" body
        osc2Gain.gain.setValueAtTime(0.4, time);
        osc2Gain.gain.exponentialRampToValueAtTime(0.01, time + 1.2);

        // Master Amp Envelope (ADSR)
        const masterGain = this.audioContext.createGain();
        masterGain.gain.setValueAtTime(0, time);
        masterGain.gain.linearRampToValueAtTime(0.8, time + 0.02); // Attack
        masterGain.gain.exponentialRampToValueAtTime(0.4, time + 0.1); // Decay to Sustain level
        masterGain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.5, event.duration)); // Release/Tail

        // Reduce volume for high notes to prevent harshness, boost low notes
        // Simple scaling: C4 (261Hz) = 1.0. 
        // Logic: Lower gain slightly as pitch increases.
        // const velocity = 1.0; 

        // Connections
        // Osc1 -> Filter -> Osc1Gain -> MasterGain
        osc1.connect(filter);
        filter.connect(osc1Gain);
        osc1Gain.connect(masterGain);

        // Osc2 -> Osc2Gain -> MasterGain (Bypass filter for strong fundamental)
        osc2.connect(osc2Gain);
        osc2Gain.connect(masterGain);

        masterGain.connect(this.audioContext.destination);

        // Start/Stop
        osc1.start(time);
        osc2.start(time);

        // Stop logic: Stop slightly after release to ensure silence
        const stopTime = time + Math.max(0.5, event.duration) + 0.2;
        osc1.stop(stopTime);
        osc2.stop(stopTime);

        // Cleanup (Garbage collection aid, though AC handles it usually)
        osc1.onended = () => { masterGain.disconnect(); };
    }

    // Temporary test method
    public testSound(): void {
        // ...
    }
}
