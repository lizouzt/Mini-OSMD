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

export class MusicSheet {
    public Transpose: number = 0;
    public sourceMeasures: SourceMeasure[] = [];
    public slurs: Slur[] = [];
    public ties: Tie[] = [];
    public wedges: Wedge[] = [];
    public octaveShifts: OctaveShift[] = [];
    public instruments: Instrument[] = [];

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
