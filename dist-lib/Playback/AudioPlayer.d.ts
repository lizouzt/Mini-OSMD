import { MusicSheet } from '../MusicalScore/MusicSheet';
export declare class AudioPlayer {
    private audioContext;
    private isPlaying;
    private events;
    private nextEventIndex;
    private schedulerInterval;
    private startTime;
    constructor();
    init(): void;
    resume(): Promise<void>;
    loadScore(sheet: MusicSheet): void;
    play(): void;
    stop(): void;
    get state(): AudioContextState;
    private schedule;
    private playEvent;
    testSound(): void;
}
