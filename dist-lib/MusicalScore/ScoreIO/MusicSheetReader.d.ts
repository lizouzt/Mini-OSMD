import { MusicSheet } from '../MusicSheet';
export declare class MusicSheetReader {
    static transpose: number;
    static readMusicXML(xmlString: string): MusicSheet;
    private static parseNote;
}
