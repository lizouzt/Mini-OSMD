import { Note } from "./Note";
import { ClefInstruction } from "./Instructions/ClefInstruction";
import { KeyInstruction } from "./Instructions/KeyInstruction";
import { RhythmInstruction } from "./Instructions/RhythmInstruction";

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

    public endBarType: BarLineType = BarLineType.Single;

    public endingType: EndingType = EndingType.None;
    public endingNumber: string = "";

    public printNewSystem: boolean = false;
    public printNewPage: boolean = false;

    public addNote(note: Note): void {
        this.notes.push(note);
    }
}

