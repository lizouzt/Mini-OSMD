import { MusicSheet } from '../MusicSheet';
export declare class MusicSheetReader {
    static readMusicXML(xmlString: string): MusicSheet;
    private static parseNote;
}
