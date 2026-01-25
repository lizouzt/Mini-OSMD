import { Note } from "./Note";

export class Tuplet {
    constructor(actualNotes: number, normalNotes: number) {
        this.actualNotes = actualNotes; // e.g., 3
        this.normalNotes = normalNotes; // e.g., 2
    }

    public actualNotes: number;
    public normalNotes: number;
    public notes: Note[] = [];
    public bracket: boolean = true; // Default to true (or better: undefined?)
    public showNumber: boolean = true; // Default to true
    public placement: string | undefined; // "above" | "below"
}
