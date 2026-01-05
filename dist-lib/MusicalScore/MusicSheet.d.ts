import { SourceMeasure } from './VoiceData/SourceMeasure';
import { Slur } from './VoiceData/Slur';
import { Tie } from './VoiceData/Tie';
import { Wedge } from './VoiceData/Wedge';
import { OctaveShift } from './VoiceData/OctaveShift';
export declare class MusicSheet {
    sourceMeasures: SourceMeasure[];
    slurs: Slur[];
    ties: Tie[];
    wedges: Wedge[];
    octaveShifts: OctaveShift[];
    addMeasure(measure: SourceMeasure): void;
}
