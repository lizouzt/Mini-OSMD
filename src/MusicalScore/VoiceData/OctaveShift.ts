import { Note } from "./Note";

export enum OctaveShiftType {
    Up = 0, // 8va (Play higher, sign above)
    Down = 1 // 8vb (Play lower, sign below)
}

export class OctaveShift {
    constructor(type: OctaveShiftType) {
        this.type = type;
    }
    public type: OctaveShiftType;
    public startNote: Note | undefined;
    public endNote: Note | undefined;
}
