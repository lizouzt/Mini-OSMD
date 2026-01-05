import { Note } from './Note';
import { ClefInstruction } from './Instructions/ClefInstruction';
import { KeyInstruction } from './Instructions/KeyInstruction';
import { RhythmInstruction } from './Instructions/RhythmInstruction';
export declare enum BarLineType {
    Single = 0,
    Double = 1,
    End = 2,
    RepeatEnd = 3,
    RepeatBegin = 4
}
export declare enum EndingType {
    None = 0,
    Start = 1,
    Stop = 2,
    StartStop = 3,
    Discontinue = 4
}
export declare class SourceMeasure {
    constructor(measureNumber: number);
    measureNumber: number;
    notes: Note[];
    clefs: ClefInstruction[];
    keys: KeyInstruction[];
    rhythms: RhythmInstruction[];
    endBarType: BarLineType;
    endingType: EndingType;
    endingNumber: string;
    addNote(note: Note): void;
}
