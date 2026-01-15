import { SourceMeasure } from "./VoiceData/SourceMeasure";
import { Slur } from "./VoiceData/Slur";
import { Tie } from "./VoiceData/Tie";
import { Wedge } from "./VoiceData/Wedge";
import { OctaveShift } from "./VoiceData/OctaveShift";

export class Instrument {
    public Transpose: number = 0;
    public PlaybackTranspose: number = 0;
    constructor(public id: string, public name: string, public numStaves: number = 1) { }
}

export class PartGroup {
    constructor(
        public startStaffId: number,
        public endStaffId: number,
        public groupSymbol: string // "brace", "line", "bracket", "square"
    ) { }
}

export class MusicSheet {
    public Title: string | undefined;
    public Composer: string | undefined;
    public Transpose: number = 0;
    public sourceMeasures: SourceMeasure[] = [];
    public slurs: Slur[] = [];
    public ties: Tie[] = [];
    public wedges: Wedge[] = [];
    public octaveShifts: OctaveShift[] = [];
    public instruments: Instrument[] = [];
    public partGroups: PartGroup[] = [];

    public addMeasure(measure: SourceMeasure): void {
        this.sourceMeasures.push(measure);
    }

    public getInstrumentForStaff(staffId: number): Instrument | undefined {
        let currentStaffOffset = 0;
        for (const instrument of this.instruments) {
            if (staffId > currentStaffOffset && staffId <= currentStaffOffset + instrument.numStaves) {
                return instrument;
            }
            currentStaffOffset += instrument.numStaves;
        }
        return undefined;
    }
}
