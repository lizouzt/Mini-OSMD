import { Note } from './Note';
export declare class Tuplet {
    constructor(actualNotes: number, normalNotes: number);
    actualNotes: number;
    normalNotes: number;
    notes: Note[];
}
