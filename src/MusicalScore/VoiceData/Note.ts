import { Pitch } from "./Pitch";
import { Fraction } from "../../Common/DataObjects/Fraction";
import { Slur } from "./Slur";
import { Tuplet } from "./Tuplet";
import { Tie } from "./Tie";

export interface Lyric {
    text: string;
    syllabic: string;
}

export class Note {
    public pitch: Pitch;
    public length: Fraction;
    /** The duration type string (e.g. "whole", "half", "quarter", "eighth"). */
    public durationType: string;
    /** The voice ID (e.g. "1", "2"). Default "1". */
    public voiceId: string;
    /** The staff ID (e.g. 1, 2). Default 1. */
    public staffId: number;
    /** The absolute timestamp within the measure (in discrete units, e.g. 1/16th). */
    public timestamp: Fraction;
    
    public slurStarts: Slur[] = [];
    public slurEnds: Slur[] = [];
    
    public tieStarts: Tie[] = [];
    public tieEnds: Tie[] = [];

    public tuplet?: Tuplet;
    public isGrace: boolean = false;
    public isRest: boolean = false;
    public articulations: string[] = []; // e.g. "staccato", "accent", "fermata"
    public lyrics: Lyric[] = []; // Changed from single lyric
    public dynamics: string[] = []; // e.g. "p", "f", "mf"

    constructor(pitch: Pitch, length: Fraction, durationType: string = "quarter", voiceId: string = "1", timestamp: Fraction = new Fraction(0, 1), staffId: number = 1) {
        this.pitch = pitch;
        this.length = length;
        this.durationType = durationType;
        this.voiceId = voiceId;
        this.timestamp = timestamp;
        this.staffId = staffId;
    }
}
