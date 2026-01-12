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

    public static transpose(pitch: Pitch, semitones: number): Pitch {
        // Calculate MIDI-like number (C4 = 60). NoteEnum C=0, B=11.
        // Step + Alter + (Octave+1)*12
        const midi = pitch.step + pitch.alter + (pitch.octave + 1) * 12;
        const targetMidi = midi + semitones;

        const targetOctave = Math.floor(targetMidi / 12) - 1;
        let remainder = targetMidi % 12;
        if (remainder < 0) remainder += 12;

        // Map remainder to Step/Alter
        // 0->C, 1->C#, 2->D, 3->Eb (preferred in flats), 4->E, 5->F, 6->F#, 7->G, 8->Ab, 9->A, 10->Bb, 11->B
        // Naive mapping: Prefer sharps for simplicity unless strictly flat keys?
        // Let's use a standard mapping that works for common keys. 
        // 0=C, 1=C#, 2=D, 3=Eb(D#), 4=E, 5=F, 6=F#, 7=G, 8=Ab(G#), 9=A, 10=Bb(A#), 11=B

        // For -7 semitones on Bb (10): 10 - 7 = 3 (Eb).

        let step = NoteEnum.C;
        let alter = 0;

        switch (remainder) {
            case 0: step = NoteEnum.C; alter = 0; break;
            case 1: step = NoteEnum.C; alter = 1; break; // C#
            case 2: step = NoteEnum.D; alter = 0; break; // D
            case 3: step = NoteEnum.E; alter = -1; break; // Eb (Preference)
            case 4: step = NoteEnum.E; alter = 0; break;
            case 5: step = NoteEnum.F; alter = 0; break;
            case 6: step = NoteEnum.F; alter = 1; break; // F#
            case 7: step = NoteEnum.G; alter = 0; break;
            case 8: step = NoteEnum.A; alter = -1; break; // Ab
            case 9: step = NoteEnum.A; alter = 0; break;
            case 10: step = NoteEnum.B; alter = -1; break; // Bb
            case 11: step = NoteEnum.B; alter = 0; break;
        }

        return new Pitch(step, targetOctave, alter);
    }
}
