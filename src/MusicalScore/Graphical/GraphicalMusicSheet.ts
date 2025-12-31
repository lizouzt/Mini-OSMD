import { MusicSheet } from "../MusicSheet";

export class GraphicalMusicSheet {
    constructor(musicSheet: MusicSheet) {
        this.musicSheet = musicSheet;
    }

    public musicSheet: MusicSheet;
    // In a real OSMD, this would hold pages, systems, etc.
}
