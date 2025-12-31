export class KeyInstruction {
    constructor(key: number, mode: string) {
        this.key = key; // number of sharps (positive) or flats (negative)
        this.mode = mode; // "major" or "minor"
    }

    public key: number;
    public mode: string;
}
