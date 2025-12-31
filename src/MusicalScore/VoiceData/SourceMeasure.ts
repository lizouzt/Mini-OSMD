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

export class SourceMeasure {
    constructor(measureNumber: number) {
        this.measureNumber = measureNumber;
    }

    public measureNumber: number;
    public notes: Note[] = [];
    
    // Attributes per Staff (Index 1-based usually, but we can use array index 0 for staff 1)
    // Actually, let's use a simple array where index 0 = Staff 1
    public clefs: ClefInstruction[] = [];
    public keys: KeyInstruction[] = [];
    public rhythms: RhythmInstruction[] = [];
    
    public endBarType: BarLineType = BarLineType.Single;

    public addNote(note: Note): void {
        this.notes.push(note);
    }
}
