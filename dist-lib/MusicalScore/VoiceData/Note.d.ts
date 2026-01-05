import { Pitch } from './Pitch';
import { Fraction } from '../../Common/DataObjects/Fraction';
import { Slur } from './Slur';
import { Tuplet } from './Tuplet';
import { Tie } from './Tie';
export interface Lyric {
    text: string;
    syllabic: string;
}
export declare class Note {
    pitch: Pitch;
    length: Fraction;
    /** The duration type string (e.g. "whole", "half", "quarter", "eighth"). */
    durationType: string;
    /** The voice ID (e.g. "1", "2"). Default "1". */
    voiceId: string;
    /** The staff ID (e.g. 1, 2). Default 1. */
    staffId: number;
    /** The absolute timestamp within the measure (in discrete units, e.g. 1/16th). */
    timestamp: Fraction;
    slurStarts: Slur[];
    slurEnds: Slur[];
    tieStarts: Tie[];
    tieEnds: Tie[];
    tuplet?: Tuplet;
    isGrace: boolean;
    articulations: string[];
    lyrics: Lyric[];
    dynamics: string[];
    constructor(pitch: Pitch, length: Fraction, durationType?: string, voiceId?: string, timestamp?: Fraction, staffId?: number);
}
