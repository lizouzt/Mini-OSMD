import { Note } from "./Note";

export class Tuplet {
    constructor(actualNotes: number, normalNotes: number) {
        this.actualNotes = actualNotes; // e.g., 3
        this.normalNotes = normalNotes; // e.g., 2
    }

    public actualNotes: number;
    public normalNotes: number;
    public notes: Note[] = [];
}
