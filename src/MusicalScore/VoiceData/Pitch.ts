export enum NoteEnum {
    C = 0,
    D = 2,
    E = 4,
    F = 5,
    G = 7,
    A = 9,
    B = 11
}

export class Pitch {
    constructor(step: NoteEnum, octave: number, alter: number) {
        this.step = step;
        this.octave = octave;
        this.alter = alter;
    }

    public step: NoteEnum;
    public octave: number;
    public alter: number;

    public get Frequency(): number {
        // Simple formula for A4 = 440Hz
        const n = (this.step + this.alter) + (this.octave - 4) * 12 - 9;
        return 440 * Math.pow(2, n / 12);
    }
}
