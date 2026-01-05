export declare class VexFlowMusicSheetDrawer {
    constructor(container: HTMLElement);
    private container;
    private renderer;
    private ctx;
    draw(data: {
        systems: any[][];
        curves: any[];
    }): Map<number, {
        x: number;
        y: number;
        height: number;
    }[]>;
    /**
     * Calculates the Y positions for each staff in a system to avoid collisions.
     */
    private calculateSystemLayout;
    private measureStaffBottom;
    private measureStaffTop;
    private createVoices;
}
