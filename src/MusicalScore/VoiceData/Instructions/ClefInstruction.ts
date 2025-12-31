export enum ClefEnum {
    G = 0,
    F = 1,
    C = 2,
    PERCUSSION = 3,
    TAB = 4
}

export class ClefInstruction {
    constructor(clefType: ClefEnum, line: number) {
        this.clefType = clefType;
        this.line = line;
    }

    public clefType: ClefEnum;
    public line: number;
}
