import { Note } from "./Note";
import { ClefInstruction } from "./Instructions/ClefInstruction";
import { KeyInstruction } from "./Instructions/KeyInstruction";
import { RhythmInstruction } from "./Instructions/RhythmInstruction";
import { Fraction } from "../../Common/DataObjects/Fraction";

export enum BarLineType {
    Single = 0,
    Double = 1,
    End = 2,
    RepeatEnd = 3,
    RepeatBegin = 4
}

export enum EndingType {
    None = 0,
    Start = 1,
    Stop = 2,
    StartStop = 3,
    Discontinue = 4
}

export class SourceMeasure {
    constructor(measureNumber: number) {
        this.measureNumber = measureNumber;
    }

    public measureNumber: number;
    public notes: Note[] = [];

    public clefs: ClefInstruction[] = [];
    public keys: KeyInstruction[] = [];
    public rhythms: RhythmInstruction[] = [];
    public chordSymbols: any[] = []; // ChordSymbolContainer[]


    public endBarType: BarLineType = BarLineType.Single;

    public endingType: EndingType = EndingType.None;
    public endingNumber: string = "";

    public printNewSystem: boolean = false;
    public printNewPage: boolean = false;

    // Layout Distances (from MusicXML <system-layout>)
    public systemDistance: number | undefined = undefined;
    public staffDistance: number | undefined = undefined;
    public topSystemDistance: number | undefined = undefined;

    // Page Layout (from <print><page-layout>)
    // If present, these override global defaults for this page (or start of this page)
    public pageLayout: {
        width: number | undefined;
        height: number | undefined;
        margins: {
            left: number | undefined;
            right: number | undefined;
            top: number | undefined;
            bottom: number | undefined;
        } | undefined;
    } | undefined;

    public tempoInBPM: number = 0; // Legacy
    public tempos: { timestamp: Fraction, bpm: number }[] = [];
    public rehearsalMarks: string[] = []; // Rehearsal Marks (e.g. "A", "B", "1")
    public pedals: { type: string, line: boolean, timestamp: Fraction }[] = [];
    public octaveShifts: { type: string, size: number, number: number, timestamp: Fraction, staffId: number }[] = [];

    public addNote(note: Note): void {
        this.notes.push(note);
    }
}

