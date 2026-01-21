import { Note } from './Note';
import { ClefInstruction } from './Instructions/ClefInstruction';
import { KeyInstruction } from './Instructions/KeyInstruction';
import { RhythmInstruction } from './Instructions/RhythmInstruction';
import { Fraction } from '../../Common/DataObjects/Fraction';
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
    chordSymbols: any[];
    endBarType: BarLineType;
    endingType: EndingType;
    endingNumber: string;
    printNewSystem: boolean;
    printNewPage: boolean;
    systemDistance: number | undefined;
    staffDistance: number | undefined;
    topSystemDistance: number | undefined;
    pageLayout: {
        width: number | undefined;
        height: number | undefined;
        margins: {
            left: number | undefined;
            right: number | undefined;
            top: number | undefined;
            bottom: number | undefined;
        } | undefined;
    } | undefined;
    tempos: {
        timestamp: Fraction;
        bpm: number;
    }[];
    addNote(note: Note): void;
}
