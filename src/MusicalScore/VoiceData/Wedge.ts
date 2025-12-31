import { Note } from "./Note";

export enum WedgeType {
    Crescendo = 0,
    Diminuendo = 1
}

export class Wedge {
    constructor(type: WedgeType) {
        this.type = type;
    }
    public type: WedgeType;
    public startNote: Note | undefined;
    public endNote: Note | undefined;
}
