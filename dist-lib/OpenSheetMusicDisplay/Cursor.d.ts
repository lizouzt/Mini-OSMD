export declare class Cursor {
    constructor(container: HTMLElement);
    private container;
    private cursorElement;
    private timestampMap;
    private timestamps;
    private currentIndex;
    init(timestampMap: Map<number, {
        x: number;
        y: number;
        height: number;
    }[]>): void;
    show(): void;
    hide(): void;
    next(): void;
    prev(): void;
    reset(): void;
    private update;
}
