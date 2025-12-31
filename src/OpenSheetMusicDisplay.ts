import { MusicSheetReader } from "./MusicalScore/ScoreIO/MusicSheetReader";
import { GraphicalMusicSheet } from "./MusicalScore/Graphical/GraphicalMusicSheet";
import { VexFlowMusicSheetCalculator } from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetCalculator";
import { VexFlowMusicSheetDrawer } from "./MusicalScore/Graphical/VexFlow/VexFlowMusicSheetDrawer";
import { MusicSheet } from "./MusicalScore/MusicSheet";
import { MXLHelper } from "./Common/FileIO/MXLHelper";

export class OpenSheetMusicDisplay {
    constructor(container: string | HTMLElement) {
        if (typeof container === "string") {
            const el = document.getElementById(container);
            if (!el) throw new Error("Container element not found");
            this.container = el;
        } else {
            this.container = container;
        }
        this.drawer = new VexFlowMusicSheetDrawer(this.container);
    }

    private container: HTMLElement;
    private drawer: VexFlowMusicSheetDrawer;
    private sheet: MusicSheet | undefined;
    private graphicalSheet: GraphicalMusicSheet | undefined;

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
                        // Very crude binary string check, might fail if encoding issues
                        // Better if user passes ArrayBuffer for MXL
                        // But for string input, assume XML unless...
                        xml = content; // Assume XML
                    } else {
                        xml = content;
                    }
                } else {
                    // ArrayBuffer -> MXL
                    xml = await MXLHelper.MXLtoXML(content);
                }

                this.sheet = MusicSheetReader.readMusicXML(xml);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Render the loaded sheet music.
     */
    public render(): void {
        if (!this.sheet) {
            console.warn("No sheet loaded. Call load() first.");
            return;
        }
        this.graphicalSheet = new GraphicalMusicSheet(this.sheet);
        const width = this.container.clientWidth || 1000;
        const vfMeasures = VexFlowMusicSheetCalculator.format(this.graphicalSheet, width);
        this.drawer.draw(vfMeasures);
    }
}
