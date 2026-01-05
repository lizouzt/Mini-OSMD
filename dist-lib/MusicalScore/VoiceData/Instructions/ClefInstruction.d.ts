export declare enum ClefEnum {
    G = 0,
    F = 1,
    C = 2,
    PERCUSSION = 3,
    TAB = 4
}
export declare class ClefInstruction {
    constructor(clefType: ClefEnum, line: number);
    clefType: ClefEnum;
    line: number;
}
