import { SourceMeasure } from './VoiceData/SourceMeasure';
import { Slur } from './VoiceData/Slur';
import { Tie } from './VoiceData/Tie';
import { Wedge } from './VoiceData/Wedge';
import { OctaveShift } from './VoiceData/OctaveShift';
export declare class Instrument {
    id: string;
    name: string;
    numStaves: number;
    Transpose: number;
    PlaybackTranspose: number;
    constructor(id: string, name: string, numStaves?: number);
}
export declare class PartGroup {
    startStaffId: number;
    endStaffId: number;
    groupSymbol: string;
    constructor(startStaffId: number, endStaffId: number, groupSymbol: string);
}
export declare class MusicSheet {
    Title: string | undefined;
    Composer: string | undefined;
    Transpose: number;
    sourceMeasures: SourceMeasure[];
    slurs: Slur[];
    ties: Tie[];
    wedges: Wedge[];
    octaveShifts: OctaveShift[];
    instruments: Instrument[];
    partGroups: PartGroup[];
    addMeasure(measure: SourceMeasure): void;
    getInstrumentForStaff(staffId: number): Instrument | undefined;
}
