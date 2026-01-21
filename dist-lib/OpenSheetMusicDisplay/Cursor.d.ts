import { OpenSheetMusicDisplay } from '../OpenSheetMusicDisplay';
import { MusicSheet } from '../MusicalScore/MusicSheet';
export declare enum CursorType {
    ThinLeft = 0,
    CurrentArea = 1
}
export interface CursorOptions {
    type: CursorType;
    color: string;
    alpha: number;
    follow: boolean;
}
export declare class Cursor {
    constructor(container: HTMLElement, osmd: OpenSheetMusicDisplay, options?: Partial<CursorOptions>);
    private container;
    private cursorElement;
    private osmd;
    private options;
    private sheet;
    private noteMap;
    private measureBounds;
    private steps;
    private currentIndex;
    get hidden(): boolean;
    get iteratorIndex(): number;
    set iteratorIndex(value: number);
    init(sheet: MusicSheet, noteMap: Map<any, any>, measureBounds: Map<number, {
        topY: number;
        botY: number;
    }>): void;
    show(): void;
    hide(): void;
    next(): void;
    prev(): void;
    reset(): void;
    setMeasure(measureIndex: number): void;
    setOptions(options: Partial<CursorOptions>): void;
    private updateStyle;
    private hexToRgb;
    update(): void;
}
