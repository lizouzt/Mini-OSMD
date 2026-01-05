import { Note } from './Note';
export declare enum OctaveShiftType {
    Up = 0,// 8va (Play higher, sign above)
    Down = 1
}
export declare class OctaveShift {
    constructor(type: OctaveShiftType);
    type: OctaveShiftType;
    startNote: Note | undefined;
    endNote: Note | undefined;
}
