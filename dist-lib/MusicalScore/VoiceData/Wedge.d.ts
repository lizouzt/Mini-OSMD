import { Note } from './Note';
export declare enum WedgeType {
    Crescendo = 0,
    Diminuendo = 1
}
export declare class Wedge {
    constructor(type: WedgeType);
    type: WedgeType;
    startNote: Note | undefined;
    endNote: Note | undefined;
}
