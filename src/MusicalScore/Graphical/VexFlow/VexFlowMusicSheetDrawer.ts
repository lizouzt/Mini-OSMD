import Vex from "vexflow";

const VF = Vex.Flow;

export class VexFlowMusicSheetDrawer {
    constructor(container: HTMLElement) {
        this.renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
        this.ctx = this.renderer.getContext();
    }

    private renderer: any;
    private ctx: any;

    public draw(data: { systems: any[][], curves: any[] }): void {
        const { systems, curves } = data;
        this.ctx.clear();
        const startX = 10;
        let x = startX;
        let y = 40;
        const width = 200; // Simplified fixed measure width for now
        const systemHeight = 120; // Height of one staff system

        for (const system of systems) {
            x = startX; // Reset X for new system
            let maxSystemBottomY = y; // Track the lowest point in this system

            for (const measureData of system) {
                const staves = measureData.staves;
                let currentY = y;
                
                const vfStaves: any[] = [];

                staves.forEach((staffData: any, index: number) => {
                    const stave = new VF.Stave(x, currentY, measureData.width);
                    
                    if (staffData.clef || x === startX) {
                        stave.addClef(staffData.clef || "treble");
                    }
                    if (staffData.keySignature) {
                        stave.addKeySignature(staffData.keySignature);
                    }
                    if (staffData.timeSignature) {
                        stave.addTimeSignature(staffData.timeSignature);
                    }
                    if (measureData.endBarLineType !== undefined) {
                        stave.setEndBarType(measureData.endBarLineType);
                    }

                    stave.setContext(this.ctx).draw();
                    vfStaves.push(stave);

                    // Draw Voices
                    const voiceIds = Object.keys(staffData.vfVoices || {});
                    let staffBottomY = stave.getYForBottomText(0); // Default bottom

                    if (voiceIds.length > 0) {
                         let numBeats = 4;
                         let beatValue = 4;
                         if (staffData.timeSignature) {
                             const parts = staffData.timeSignature.split("/");
                             numBeats = parseInt(parts[0]);
                             beatValue = parseInt(parts[1]);
                         }

                         const voices: any[] = [];
                         let allNotes: any[] = [];

                         for (const vid of voiceIds) {
                             const notes = staffData.vfVoices[vid];
                             const voice = new VF.Voice({ num_beats: numBeats, beat_value: beatValue });
                             voice.addTickables(notes);
                             voices.push(voice);
                             allNotes.push(...notes);
                         }

                         const formatter = new VF.Formatter().joinVoices(voices).format(voices, measureData.width - 50);
                         
                         voices.forEach(v => v.draw(this.ctx, stave));
                            
                         if (staffData.beams) {
                             staffData.beams.forEach((beam: any) => beam.setContext(this.ctx).draw());
                         }
                         if (staffData.vfTuplets) {
                             staffData.vfTuplets.forEach((t: any) => t.setContext(this.ctx).draw());
                         }

                         // Calculate Bounding Box for Collision Avoidance
                         // Check all notes and their modifiers (lyrics, dynamics)
                         allNotes.forEach(note => {
                             const bbox = note.getBoundingBox();
                             if (bbox) {
                                 staffBottomY = Math.max(staffBottomY, bbox.getY() + bbox.getH());
                             }
                             // Check modifiers specifically if not included in note bbox (VexFlow versions vary)
                             note.getModifiers().forEach((mod: any) => {
                                 if (mod.getBoundingBox) { // Some modifiers might calculate strictly
                                     // VexFlow modifier layout logic is complex, sometimes note bbox includes them.
                                     // But Lyrics (Annotation) definitely extend down.
                                 }
                             });
                         });
                    }

                    // Set next Y based on calculated bottom + padding
                    const nextStaveY = staffBottomY + 40; // 40px padding
                    currentY = nextStaveY;
                    maxSystemBottomY = Math.max(maxSystemBottomY, staffBottomY);
                });

                // Draw Connector (Brace) if multiple staves
                if (vfStaves.length > 1 && x === startX) {
                     const connector = new VF.StaveConnector(vfStaves[0], vfStaves[vfStaves.length - 1]);
                     connector.setType(VF.StaveConnector.type.BRACE);
                     connector.setContext(this.ctx).draw();
                     
                     const lineConnector = new VF.StaveConnector(vfStaves[0], vfStaves[vfStaves.length - 1]);
                     lineConnector.setType(VF.StaveConnector.type.SINGLE_LEFT);
                     lineConnector.setContext(this.ctx).draw();
                }

                x += measureData.width;
            }
            
            y = maxSystemBottomY + 60; // Space between systems
        }

        // Draw Curves (after all staves and notes are drawn, so coordinates are set)
        if (curves) {
            curves.forEach(curve => curve.setContext(this.ctx).draw());
        }

        this.renderer.resize(this.renderer.element.clientWidth, y + 100);
    }
}
