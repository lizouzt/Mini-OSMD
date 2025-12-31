import { SourceMeasure } from "./VoiceData/SourceMeasure";
import { Slur } from "./VoiceData/Slur";
import { Tie } from "./VoiceData/Tie";
import { Wedge } from "./VoiceData/Wedge";
import { OctaveShift } from "./VoiceData/OctaveShift";

export class MusicSheet {
    public sourceMeasures: SourceMeasure[] = [];
    public slurs: Slur[] = [];
    public ties: Tie[] = [];
    public wedges: Wedge[] = [];
    public octaveShifts: OctaveShift[] = [];

    public addMeasure(measure: SourceMeasure): void {
        this.sourceMeasures.push(measure);
    }
}
