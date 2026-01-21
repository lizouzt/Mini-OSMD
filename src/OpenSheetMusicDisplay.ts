import { MusicSheetReader } from "./MusicalScore/ScoreIO/MusicSheetReader";
import { GraphicalMusicSheet } from "./MusicalScore/Graphical/GraphicalMusicSheet";
import { VexFlowMusicSheetCalculator } from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetCalculator";
import { VexFlowMusicSheetDrawer } from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetDrawer";
import { MusicSheet } from "./MusicalScore/MusicSheet";
import { MXLHelper } from "./Common/FileIO/MXLHelper";
import { Cursor, CursorType } from "./OpenSheetMusicDisplay/Cursor";
import type { CursorOptions } from "./OpenSheetMusicDisplay/Cursor";
import { AudioPlayer } from "./Playback/AudioPlayer";
import { MusicSheetHydrator } from "./Common/Hydration/MusicSheetHydrator";
// Vite Worker Import
import MusicSheetParserWorker from "./Worker/MusicSheetParser.worker?worker";

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
        this.AudioPlayer = new AudioPlayer();

        // Initialize Worker
        try {
            this.parserWorker = new MusicSheetParserWorker();
            this.parserWorker!.onmessage = (e) => {
                // If we were handling async requests widely, we'd need ID correlation.
                // For now, load() is a single active operation.
            };
        } catch (e) {
            console.warn("Worker not supported or failed to initialize. Falling back to main thread.", e);
        }

        // Interaction: Click to Set Cursor
        this.container.addEventListener("click", (event) => {
            this.handleMouseClick(event);
        });

        // Virtual Rendering: Scroll Listener
        let scrollTimeout: any;
        this.container.addEventListener("scroll", () => {
            if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
            scrollTimeout = requestAnimationFrame(() => this.onScroll());
        });

        // Responsive Resize: Observer
        this.resizeObserver = new ResizeObserver(entries => {
            // Simple debounce
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.onResize();
            }, 200);
        });
        this.resizeObserver.observe(this.container);
    }

    private container: HTMLElement;
    private drawer: VexFlowMusicSheetDrawer;
    private measureBounds: Map<number, { topY: number, botY: number }> | undefined;
    private sheet: MusicSheet | undefined;
    private graphicalSheet: GraphicalMusicSheet | undefined;
    private isDarkMode: boolean = false;
    private _zoom: number = 1.0;

    private parserWorker: Worker | undefined;

    private resizeObserver: ResizeObserver;
    private resizeTimeout: any; // Timer ID

    public cursor: Cursor;
    public AudioPlayer: AudioPlayer;

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
                        // Likely MXL string (binary string), handle if needed
                        xml = content;
                    } else {
                        xml = content;
                    }
                } else {
                    xml = await MXLHelper.MXLtoXML(content);
                }

                if (this.parserWorker) {
                    // Use Worker
                    this.parserWorker.onmessage = (e) => {
                        const { success, data, error } = e.data;
                        if (success) {
                            try {
                                console.time("Hydration");
                                this.sheet = MusicSheetHydrator.hydrate(data);
                                console.timeEnd("Hydration");
                                resolve();
                            } catch (hError) {
                                reject(hError);
                            }
                        } else {
                            reject(new Error(error));
                        }
                    };
                    this.parserWorker.onerror = (e) => {
                        reject(e);
                    }
                    this.parserWorker.postMessage({ xml });
                } else {
                    // Fallback
                    this.sheet = MusicSheetReader.readMusicXML(xml);
                    resolve();
                }
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

        // Recreate drawer only if container changed (unlikely) or valid resize needed?
        // Actually, we should reuse the drawer instance to preserve SVG element if possible, 
        // OR just clear it. The drawer constructor removes existing SVGs. 
        // If we reuse, we must ensure clear() is called (it is called in draw()).
        // For existing logic parity, let's keep one instance.
        // this.drawer = new VexFlowMusicSheetDrawer(this.container); <--- REMOVED

        this.graphicalSheet = new GraphicalMusicSheet(this.sheet);
        const width = this.container.clientWidth || 1000;
        const effectiveWidth = width / this.zoom;

        // format now returns noteMap as well
        const { systems, curves, noteMap, metadata, partGroups } = VexFlowMusicSheetCalculator.format(this.graphicalSheet, this.sheet, effectiveWidth - 20);

        // 1. Prepare Layout
        this.drawer.prepareLayout({ systems, curves, partGroups, metadata }, { darkMode: this.isDarkMode, zoom: this.zoom });

        // 2. Generate Measure Bounds Map for Cursor (for ALL measures)
        // This ensures Cursor works even if measure is not rendered yet
        this.measureBounds = new Map<number, { topY: number, botY: number }>();
        if (this.sheet) {
            const measures = this.sheet.sourceMeasures;
            for (let i = 0; i < measures.length; i++) {
                // Measure Index is 0-based
                const bounds = this.drawer.getMeasureBounds(i);
                if (bounds) {
                    this.measureBounds.set(i, bounds);
                }
            }
        }

        // 3. Initial Render (Visible Viewport)
        this.updateViewportRender();

        // 4. Setup Scroll Listener (Debounced)
        // Remove old listener if exists? changing 'this.render' creates closure issues.
        // Ideally we bind once in constructor. But we rely on 'this.drawer' state which is refreshed here.
        // Since 'this.drawer' is now permanent, constructor binding is fine.
        // But verifying we don't duplicate listeners?
        // We added listener in constructor below? No, I need to add it now or in constructor.
        // Let's add it in constructor for cleanliness. Here we just trigger update.

        // Initialize Cursor with Sheet logic, Graphic map, and Layout bounds
        this.cursor.init(this.sheet, noteMap, this.measureBounds);

        // Restore cursor state
        if (!cursorHidden) {
            this.cursor.show();
            this.cursor.iteratorIndex = cursorIndex; // Restore position
        } else {
            this.cursor.hide();
        }
    }

    private onScroll(): void {
        this.updateViewportRender();
    }

    private updateViewportRender(): void {
        if (!this.container) return;
        const scrollTop = this.container.scrollTop;
        const clientHeight = this.container.clientHeight;

        // Render visible
        this.drawer.render({ top: scrollTop, height: clientHeight });
    }

    private onResize(): void {
        // Only render if sheet is loaded and container has width
        if (this.sheet && this.container.clientWidth > 0) {
            console.log(`[OSMD] Resize detected. Width: ${this.container.clientWidth}. Re-rendering.`);
            this.render();
        }
    }

    /**
     * Dispose the OSMD instance to release resources.
     */
    public dispose(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }

    /**
     * Export the current sheet to an Image Data URL (PNG).
     * @param scale Scaling factor (default 2 for Hi-DPI quality)
     */
    public async exportToImage(scale: number = 2): Promise<string> {
        if (!this.container) throw new Error("No container");
        const svg = this.container.querySelector("svg");
        if (!svg) throw new Error("No SVG rendered");

        // Serialize SVG
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        // Load into backend Image
        const img = new Image();
        img.src = url;

        return new Promise((resolve, reject) => {
            img.onload = () => {
                const canvas = document.createElement("canvas");
                // Use the SVG's logic width/height if set, or getBoundingClientRect
                const width = parseFloat(svg.getAttribute("width") || "1000");
                const height = parseFloat(svg.getAttribute("height") || "1000");

                canvas.width = width * scale;
                canvas.height = height * scale;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Canvas context failed"));
                    return;
                }

                // Fill white background (transparent by default)
                ctx.fillStyle = this.isDarkMode ? "#222" : "#FFF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0, width, height);

                URL.revokeObjectURL(url);
                try {
                    const dataUrl = canvas.toDataURL("image/png");
                    resolve(dataUrl);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (e) => reject(e);
        });
    }

    /**
     * Trigger browser print dialog.
     */
    public print(): void {
        window.print();
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
        const x = (event.clientX - rect.left); // Mouse relative to container (visible)
        const y = (event.clientY - rect.top) + this.container.scrollTop; // + Scroll for absolute Y

        // Note: getMeasureAt expects absolute Y (relative to document top 0) if zoomed?
        // My drawer logic uses adjustedY = y / zoom.
        // And drawer layout Y starts at 0.
        // Is container.scrollTop included in the coordinate system of the SVG?
        // The SVG is typically sized to full height, so scrollTop is handled by browser scrolling the SVG.
        // So event.clientY in container is relative to viewport.
        // We need (ViewportY + ScrollTop).

        // Wait, if the SVG is inside the container and we scroll the container, 
        // event.clientY relative to rect.top IS the visual position.
        // But the hit test needs the logical position on the SVG.
        // If SVG is scrolled up, logical Y = visual Y + scrollTop.

        const absoluteY = (event.clientY - rect.top) + this.container.scrollTop;
        const absoluteX = (event.clientX - rect.left) + this.container.scrollLeft;

        console.log(`Click at AbsY=${absoluteY}, AbsX=${absoluteX} (Zoom: ${this.zoom})`);

        const measureIndex = this.drawer.getMeasureAt(absoluteX, absoluteY, this.zoom);

        if (measureIndex !== undefined) {
            console.log(`Clicked Measure Index: ${measureIndex}`);
            if ((this.cursor as any).setMeasure) {
                (this.cursor as any).setMeasure(measureIndex);
            }
        }
    }

}

export { CursorType };
export type { CursorOptions };