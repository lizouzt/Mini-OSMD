import { MusicSheet } from '../../MusicSheet';
import { GraphicalMusicSheet } from '../GraphicalMusicSheet';
export declare class VexFlowMusicSheetCalculator {
    private static getKeySignature;
    static format(graphicalSheet: GraphicalMusicSheet, sheet: MusicSheet, containerWidth?: number): {
        systems: any[][];
        curves: any[];
        noteMap: Map<any, any>;
        partGroups: any[];
        metadata: {
            title: string | undefined;
            composer: string | undefined;
        };
        systemStaffCurves: Map<number, Map<number, any[]>>;
    };
}
