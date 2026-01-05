import { Cursor } from './OpenSheetMusicDisplay/Cursor';
export declare class OpenSheetMusicDisplay {
    constructor(container: string | HTMLElement);
    private container;
    private drawer;
    private sheet;
    private graphicalSheet;
    cursor: Cursor;
    /**
     * Load a MusicXML file string or MXL ArrayBuffer.
     * @param content The MusicXML string or MXL buffer
     */
    load(content: string | ArrayBuffer): Promise<void>;
    /**
     * Render the loaded sheet music.
     */
    render(): void;
}
