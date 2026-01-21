import { MusicSheet } from './MusicalScore/MusicSheet';
import { Cursor, CursorType, CursorOptions } from './OpenSheetMusicDisplay/Cursor';
import { AudioPlayer } from './Playback/AudioPlayer';
export declare class OpenSheetMusicDisplay {
    constructor(container: string | HTMLElement, options?: Partial<CursorOptions>);
    private container;
    private drawer;
    private measureBounds;
    private sheet;
    private graphicalSheet;
    private isDarkMode;
    private _zoom;
    private parserWorker;
    private resizeObserver;
    private resizeTimeout;
    cursor: Cursor;
    AudioPlayer: AudioPlayer;
    get Sheet(): MusicSheet | undefined;
    get zoom(): number;
    set zoom(value: number);
    /**
     * Load a MusicXML file string or MXL ArrayBuffer.
     * @param content The MusicXML string or MXL buffer
     */
    load(content: string | ArrayBuffer): Promise<void>;
    setDarkMode(darkMode: boolean): void;
    setCursorOptions(options: Partial<CursorOptions>): void;
    /**
     * Render the loaded sheet music.
     */
    render(): void;
    private onScroll;
    private updateViewportRender;
    private onResize;
    /**
     * Dispose the OSMD instance to release resources.
     */
    dispose(): void;
    /**
     * Export the current sheet to an Image Data URL (PNG).
     * @param scale Scaling factor (default 2 for Hi-DPI quality)
     */
    exportToImage(scale?: number): Promise<string>;
    /**
     * Trigger browser print dialog.
     */
    print(): void;
    /**
     * Handle mouse click events on the container.
     * Maps the click coordinates to a measure index and sets the cursor.
     */
    private handleMouseClick;
}
export { CursorType };
export type { CursorOptions };
