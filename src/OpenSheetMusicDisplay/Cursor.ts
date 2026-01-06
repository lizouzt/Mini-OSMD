export class Cursor {
    constructor(container: HTMLElement) {
        this.container = container;
        // Ensure container is relative so absolute cursor is positioned correctly
        if (getComputedStyle(this.container).position === "static") {
            this.container.style.position = "relative";
        }

        this.cursorElement = document.createElement("div");
        this.cursorElement.style.position = "absolute";
        this.cursorElement.style.zIndex = "1000";
        this.cursorElement.style.backgroundColor = "rgba(64, 156, 255, 0.4)"; // Blue transparent
        this.cursorElement.style.pointerEvents = "none";
        this.cursorElement.style.display = "none";
        this.container.appendChild(this.cursorElement);
    }

    private container: HTMLElement;
    private cursorElement: HTMLElement;
    // Map<Timestamp RealValue, Position[]>
    private timestampMap: Map<number, { x: number, y: number, width: number, height: number }[]> = new Map();
    private timestamps: number[] = [];
    private currentIndex: number = 0;

    public get hidden(): boolean {
        return this.cursorElement.style.display === "none";
    }

    public init(timestampMap: Map<number, { x: number, y: number, width: number, height: number }[]>) {
        this.timestampMap = timestampMap;
        this.timestamps = Array.from(timestampMap.keys()).sort((a, b) => a - b);
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
        if (this.currentIndex < this.timestamps.length - 1) {
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

    private update() {
        if (this.timestamps.length === 0) return;
        const ts = this.timestamps[this.currentIndex];
        const positions = this.timestampMap.get(ts);
        
        if (positions && positions.length > 0) {
            // Calculate union bounding box of all staves at this timestamp
            let minTop = positions[0].y;
            let maxBot = positions[0].y + positions[0].height;
            let minX = positions[0].x;
            let maxWidth = positions[0].width || 10;

            positions.forEach(p => {
                minTop = Math.min(minTop, p.y);
                maxBot = Math.max(maxBot, p.y + p.height);
                minX = Math.min(minX, p.x);
                maxWidth = Math.max(maxWidth, p.width || 10);
            });

            this.cursorElement.style.left = `${minX}px`;
            this.cursorElement.style.top = `${minTop}px`;
            this.cursorElement.style.height = `${maxBot - minTop}px`;
            this.cursorElement.style.width = `${maxWidth}px`;
        }
    }
}
