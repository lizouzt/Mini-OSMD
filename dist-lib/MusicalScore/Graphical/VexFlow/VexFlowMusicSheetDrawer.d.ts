export declare class VexFlowMusicSheetDrawer {
    constructor(container: HTMLElement);
    private container;
    private renderer;
    private ctx;
    private drawTitleAndComposer;
    private systemLayouts;
    private lastDrawData;
    private lastOptions;
    private totalHeight;
    clear(): void;
    draw(data: {
        systems: any[][];
        curves: any[];
        systemStaffCurves?: Map<number, Map<number, any[]>>;
        partGroups?: any[];
        metadata?: {
            title: string | undefined;
            composer: string | undefined;
        };
    }, options?: {
        darkMode?: boolean;
        zoom?: number;
    }): Map<number, {
        topY: number;
        botY: number;
    }>;
    prepareLayout(data: any, options: any): void;
    render(viewport: {
        top: number;
        height: number;
    } | null): Map<number, {
        topY: number;
        botY: number;
    }>;
    /**
     * Calculates the Y positions for each staff in a system to avoid collisions.
     */
    private calculateSystemLayout;
    private computeStaffContours;
    /**
     * Get the measure index at the given coordinates (relative to container).
     * Uses the calculated System Layout.
     */
    getMeasureAt(x: number, y: number, zoom: number): number | undefined;
    /**
     * Get bounds for a specific measure index.
     * Useful for Cursor when the measure might not be legally rendered yet,
     * or we want fast lookup without re-rendering.
     */
    getMeasureBounds(measureIndex: number): {
        topY: number;
        botY: number;
    } | undefined;
    private createVoices;
}
