import { OpenSheetMusicDisplay } from "../OpenSheetMusicDisplay";
import { MusicSheet } from "../MusicalScore/MusicSheet";

export enum CursorType {
    ThinLeft = 0,
    CurrentArea = 1
}

export interface CursorOptions {
    type: CursorType;
    color: string;
    alpha: number;
    follow: boolean;
}

export class Cursor {
    constructor(container: HTMLElement, osmd: OpenSheetMusicDisplay, options: Partial<CursorOptions> = {}) {
        this.container = container;
        this.osmd = osmd;
        
        this.options = {
            type: CursorType.CurrentArea,
            color: "#33e02f",
            alpha: 0.5,
            follow: true,
            ...options
        };

        if (getComputedStyle(this.container).position === "static") {
            this.container.style.position = "relative";
        }

        this.cursorElement = document.createElement("div");
        this.cursorElement.style.position = "absolute";
        this.cursorElement.style.zIndex = "1000";
        this.cursorElement.style.pointerEvents = "none";
        this.cursorElement.style.display = "none";
        
        this.updateStyle();
        
        this.container.appendChild(this.cursorElement);
    }

    private container: HTMLElement;
    private cursorElement: HTMLElement;
    private osmd: OpenSheetMusicDisplay;
    private options: CursorOptions;
    
    private sheet: MusicSheet | undefined;
    private noteMap: Map<any, any> | undefined; 
    private measureBounds: Map<number, { topY: number, botY: number }> | undefined;

    // Ordered steps for playback
    private steps: { timestamp: number, notes: any[], measureIndex: number, x: number }[] = [];
    private currentIndex: number = 0;

    public get hidden(): boolean {
        return this.cursorElement.style.display === "none";
    }

    public get iteratorIndex(): number {
        return this.currentIndex;
    }

    public set iteratorIndex(value: number) {
        if (value >= 0 && value < this.steps.length) {
            this.currentIndex = value;
            this.update();
        }
    }

    public init(sheet: MusicSheet, noteMap: Map<any, any>, measureBounds: Map<number, { topY: number, botY: number }>) {
        this.sheet = sheet;
        this.noteMap = noteMap;
        this.measureBounds = measureBounds;
        this.steps = [];
        
        // 1. Collect notes by Timestamp + Measure
        // We use a Map<string, Note[]> where key is "MeasureIndex_Timestamp" to grouping.
        const groupMap = new Map<string, { measureIndex: number, ts: number, notes: any[] }>();
        
        this.sheet.sourceMeasures.forEach((measure, mIndex) => {
            measure.notes.forEach(note => {
                const ts = note.timestamp.RealValue;
                const key = `${mIndex}_${ts.toFixed(4)}`; // Basic grouping by measure & time
                
                if (!groupMap.has(key)) {
                    groupMap.set(key, { measureIndex: mIndex, ts: ts, notes: [] });
                }
                groupMap.get(key)!.notes.push(note);
            });
        });

        // 2. Convert to list and Calculate Visual X
        const tempSteps: { timestamp: number, notes: any[], measureIndex: number, x: number }[] = [];
        
        groupMap.forEach(group => {
            let minX = Number.MAX_VALUE;
            let hasVisual = false;
            
            group.notes.forEach(note => {
                const vfNote = this.noteMap!.get(note);
                if (vfNote) {
                    const bbox = vfNote.getBoundingBox();
                    if (bbox) {
                        // Use unscaled X for sorting
                        if (bbox.getX() < minX) minX = bbox.getX();
                        hasVisual = true;
                    }
                }
            });
            
            if (hasVisual) {
                tempSteps.push({
                    timestamp: group.ts,
                    notes: group.notes,
                    measureIndex: group.measureIndex,
                    x: minX
                });
            }
        });

        // 3. Sort: MeasureIndex ASC -> X Position ASC
        // This forces Left-to-Right playback order regardless of timestamp micro-jitter
        tempSteps.sort((a, b) => {
            if (a.measureIndex !== b.measureIndex) return a.measureIndex - b.measureIndex;
            return a.x - b.x;
        });

        // 4. Fuzzy Merge (Optional, but sorting by X handles overlaps better)
        // If two steps have very close X (e.g. < 2px), merge them?
        // Or strictly strictly sequential.
        // Let's keep them separate steps for now unless X is identical.
        
        this.steps = tempSteps;
        this.currentIndex = 0;
        this.hide();
    }

    public show() {
        this.cursorElement.style.display = "block";
        this.update();
    }

    public hide() {
        this.cursorElement.style.display = "none";
    }

    public next() {
        if (this.currentIndex < this.steps.length - 1) {
            this.currentIndex++;
            this.update();
        }
    }

    public prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.update();
        }
    }

    public reset() {
        this.currentIndex = 0;
        this.update();
    }

    public setOptions(options: Partial<CursorOptions>) {
        this.options = { ...this.options, ...options };
        this.updateStyle();
        if (!this.hidden) this.update();
    }

    private updateStyle() {
        if (this.options.type === CursorType.ThinLeft) {
             this.cursorElement.style.background = this.options.color;
             this.cursorElement.style.opacity = "1";
             this.cursorElement.style.boxShadow = "none"; // Remove shadow to prevent visual overshoot
        } else {
             const c = this.hexToRgb(this.options.color);
             this.cursorElement.style.background = `rgba(${c.r}, ${c.g}, ${c.b}, ${this.options.alpha})`;
             this.cursorElement.style.boxShadow = "none";
             this.cursorElement.style.opacity = "1";
        }
    }

    private hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    public update() {
        if (this.steps.length === 0 || !this.sheet || !this.noteMap || !this.measureBounds) return;
        
        const step = this.steps[this.currentIndex];
        const zoom = this.osmd.zoom;

        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let found = false;

        // Recalculate X with current zoom (though step.x is unscaled)
        step.notes.forEach(note => {
            const vfNote = this.noteMap!.get(note);
            if (vfNote) {
                const bbox = vfNote.getBoundingBox();
                // Check for valid bbox (Staves start at x=10, so x<5 is likely an artifact/hidden note)
                if (bbox && bbox.getX() > 5) {
                    found = true;
                    const x = bbox.getX() * zoom;
                    const w = bbox.getW() * zoom;
                    if (x < minX) minX = x;
                    if (x + w > maxX) maxX = x + w;
                }
            }
        });

        if (found) {
            // Get System Bounds using Measure Index
            const bounds = this.measureBounds.get(step.measureIndex);
            if (bounds) {
                const minTop = bounds.topY * zoom;
                const maxBot = bounds.botY * zoom;
                const height = maxBot - minTop;
                const width = maxX - minX;

                if (this.options.type === CursorType.ThinLeft) {
                    const lineWidth = 3;
                    this.cursorElement.style.left = `${minX - (lineWidth / 2)}px`;
                    this.cursorElement.style.top = `${minTop}px`;
                    this.cursorElement.style.height = `${height}px`;
                    this.cursorElement.style.width = `${lineWidth}px`;
                } else {
                    this.cursorElement.style.left = `${minX}px`;
                    this.cursorElement.style.top = `${minTop}px`;
                    this.cursorElement.style.height = `${height}px`;
                    this.cursorElement.style.width = `${Math.max(width, 10)}px`;
                }

                if (this.options.follow) {
                    this.cursorElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'center'
                    });
                }
            }
        }
    }
}
