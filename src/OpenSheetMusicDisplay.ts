import { MusicSheetReader } from "./MusicalScore/ScoreIO/MusicSheetReader";
import { GraphicalMusicSheet } from "./MusicalScore/Graphical/GraphicalMusicSheet";
import { VexFlowMusicSheetCalculator } from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetCalculator";
import { VexFlowMusicSheetDrawer } from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetDrawer";
import { MusicSheet } from "./MusicalScore/MusicSheet";
import { MXLHelper } from "./Common/FileIO/MXLHelper";
import { Cursor, CursorType } from "./OpenSheetMusicDisplay/Cursor";
import type { CursorOptions } from "./OpenSheetMusicDisplay/Cursor";

export class OpenSheetMusicDisplay {
    constructor(container: string | HTMLElement, options: Partial<CursorOptions> = {}) {
        if (typeof container === "string") {
            const el = document.getElementById(container);
            if (!el) throw new Error("Container element not found");
            this.container = el;
        } else {
            this.container = container;
        }
        this.drawer = new VexFlowMusicSheetDrawer(this.container);
        this.cursor = new Cursor(this.container, this, options);

        // Interaction: Click to Set Cursor
        this.container.addEventListener("click", (event) => {
            this.handleMouseClick(event);
        });
    }

    private container: HTMLElement;
    private drawer: VexFlowMusicSheetDrawer;
    private measureBounds: Map<number, { topY: number, botY: number }> | undefined;
    private sheet: MusicSheet | undefined;
    private graphicalSheet: GraphicalMusicSheet | undefined;
    private isDarkMode: boolean = false;
    private _zoom: number = 1.0;

    public cursor: Cursor;

    public get Sheet(): MusicSheet | undefined {
        return this.sheet;
    }

    public get zoom(): number {
        return this._zoom;
    }

    public set zoom(value: number) {
        this._zoom = value;
        // Re-render to apply layout changes (reflow)
        this.render();
    }

    /**
     * Load a MusicXML file string or MXL ArrayBuffer.
     * @param content The MusicXML string or MXL buffer
     */
    public async load(content: string | ArrayBuffer): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let xml: string = "";

                if (typeof content === "string") {
                    if (content.startsWith("PK")) {
                        xml = content;
                    } else {
                        xml = content;
                    }
                } else {
                    xml = await MXLHelper.MXLtoXML(content);
                }

                this.sheet = MusicSheetReader.readMusicXML(xml);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    public setDarkMode(darkMode: boolean): void {
        this.isDarkMode = darkMode;

        // Update Container Background
        if (this.container) {
            this.container.style.backgroundColor = darkMode ? "#222" : ""; // Reset to CSS default (white)
        }

        if (this.sheet) {
            this.render();
        }
    }

    public setCursorOptions(options: Partial<CursorOptions>): void {
        this.cursor.setOptions(options);
    }

    /**
     * Render the loaded sheet music.
     */
    public render(): void {
        if (!this.sheet) {
            console.warn("No sheet loaded. Call load() first.");
            return;
        }

        // Preserve cursor state
        const cursorIndex = this.cursor.iteratorIndex;
        const cursorHidden = this.cursor.hidden;

        // Recreate drawer to reset VexFlow context/scale state cleanly
        // This prevents accumulated transforms and ensures clean SVG
        this.drawer = new VexFlowMusicSheetDrawer(this.container);



        this.graphicalSheet = new GraphicalMusicSheet(this.sheet);
        const width = this.container.clientWidth || 1000;
        const effectiveWidth = width / this.zoom;

        // format now returns noteMap as well
        // Use a smaller margin (e.g. 20) to avoid excessive whitespace
        const { systems, curves, noteMap, metadata, partGroups } = VexFlowMusicSheetCalculator.format(this.graphicalSheet, this.sheet, effectiveWidth - 20);

        // Draw returns measureBounds now
        this.measureBounds = this.drawer.draw({ systems, curves, partGroups, metadata }, { darkMode: this.isDarkMode, zoom: this.zoom });

        // Initialize Cursor with Sheet logic, Graphic map, and Layout bounds
        // Note: Cursor needs new noteMap and bounds
        this.cursor.init(this.sheet, noteMap, this.measureBounds);

        // Restore cursor state
        if (!cursorHidden) {
            this.cursor.show();
            this.cursor.iteratorIndex = cursorIndex; // Restore position
        } else {
            this.cursor.hide();
        }
    }

    /**
     * Handle mouse click events on the container.
     * Maps the click coordinates to a measure index and sets the cursor.
     */
    private handleMouseClick(event: MouseEvent): void {
        console.log("OSMD.handleMouseClick triggered");
        if (!this.cursor) {
            console.warn("Cursor is null");
            return;
        }
        if (!this.measureBounds) {
            console.warn("measureBounds is null/undefined");
            return;
        }

        const rect = this.container.getBoundingClientRect();
        const x = (event.clientX - rect.left) / this.zoom;
        const y = (event.clientY - rect.top) / this.zoom;

        console.log(`Click at Y=${y}, X=${x} (Zoom: ${this.zoom})`);
        console.log(`MeasureBounds sizeRef: ${this.measureBounds.size}`);

        // Iterate through known measure bounds to find the clicked measure
        for (const [measureIndex, bounds] of this.measureBounds.entries()) {
            // console.log(`Checking M${measureIndex}: [${bounds.topY}, ${bounds.botY}]`);
            if (y >= bounds.topY && y <= bounds.botY) {
                console.log(`Clicked Measure Index: ${measureIndex}`);

                // We need to implement setMeasure in Cursor or manually iterate
                if ((this.cursor as any).setMeasure) {
                    (this.cursor as any).setMeasure(measureIndex);
                } else {
                    console.warn("Cursor.setMeasure not implemented yet");
                }
                return;
            }
        }
    }

}

export { CursorType };
export type { CursorOptions };