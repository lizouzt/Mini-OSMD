import { SourceMeasure } from "./VoiceData/SourceMeasure";
import { Slur } from "./VoiceData/Slur";
import { Tie } from "./VoiceData/Tie";
import { Wedge } from "./VoiceData/Wedge";
import { OctaveShift } from "./VoiceData/OctaveShift";

export class Instrument {
    constructor(public id: string, public name: string, public numStaves: number = 1) {}
}

export class MusicSheet {
    public sourceMeasures: SourceMeasure[] = [];
    public slurs: Slur[] = [];
    public ties: Tie[] = [];
    public wedges: Wedge[] = [];
    public octaveShifts: OctaveShift[] = [];
    public instruments: Instrument[] = [];

    public addMeasure(measure: SourceMeasure): void {
        this.sourceMeasures.push(measure);
    }
}
