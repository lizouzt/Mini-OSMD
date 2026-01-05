export declare enum NoteEnum {
    C = 0,
    D = 2,
    E = 4,
    F = 5,
    G = 7,
    A = 9,
    B = 11
}
export declare class Pitch {
    constructor(step: NoteEnum, octave: number, alter: number);
    step: NoteEnum;
    octave: number;
    alter: number;
    get Frequency(): number;
}
