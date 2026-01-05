import * as VF from "vexflow";

export class VexFlowMusicSheetDrawer {
    constructor(container: HTMLElement) {
        this.container = container;
        this.renderer = new VF.Renderer(container as HTMLDivElement, VF.Renderer.Backends.SVG);
        this.ctx = this.renderer.getContext();
    }

    private container: HTMLElement;
    private renderer: any;
    private ctx: any;

    public draw(data: { systems: any[][], curves: any[] }): Map<number, { x: number, y: number, height: number }[]> {
        const { systems, curves } = data;
        this.ctx.clear();
        const startX = 10;
        let x = startX;
        let y = 50; // Initial Top Margin
        
        const cursorPositions = new Map<number, { x: number, y: number, height: number }[]>();

        // Loop Systems
        for (const system of systems) {
            // 1. Calculate Vertical Layout for this System
            const staffYOffsets = this.calculateSystemLayout(system);
            
            // 2. Determine System Height
            let maxSystemBottom = 0;

            x = startX; 

            // 3. Draw Measures
            for (const measureData of system) {
                const staves = measureData.staves;
                
                // Prepare VexFlow Staves
                const vfStaves: any[] = [];

                staves.forEach((staffData: any, index: number) => {
                    // Use calculated Offset
                    const currentY = y + staffYOffsets[index];
                    
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
                    
                    if (staffData.voltaType !== undefined && staffData.voltaType !== VF.Volta.type.NONE) {
                        stave.setVoltaType(staffData.voltaType, staffData.voltaNumber || "1", 0);
                    }

                    stave.setContext(this.ctx).draw();
                    vfStaves.push(stave);

                    const voiceIds = Object.keys(staffData.vfVoices || {});
                    
                    if (voiceIds.length > 0) {
                        const { voices, allNotes } = this.createVoices(staffData);
                        
                        // Format to width
                        const formatter = new VF.Formatter().joinVoices(voices).format(voices, measureData.width - 50);
                        
                        voices.forEach((v: any) => v.draw(this.ctx, stave));
                        
                        // Collect Cursor Positions
                        const staveTop = stave.getTopLineTopY();
                        const staveBot = stave.getBottomLineBottomY();
                        const staveHeight = staveBot - staveTop;

                        allNotes.forEach((note: any) => {
                            if (note.sourceNote) { // Attached in Calculator
                                const ts = note.sourceNote.timestamp.RealValue;
                                const bbox = note.getBoundingBox(); // Valid after draw/format? Note must be drawn for absolute x?
                                // VexFlow note x is set by formatter. Absolute X needs Stave X.
                                // If note.draw() was called, note.getBoundingBox() should returns absolute coords in SVG context.
                                if (bbox) {
                                    if (!cursorPositions.has(ts)) cursorPositions.set(ts, []);
                                    cursorPositions.get(ts)!.push({
                                        x: bbox.getX(),
                                        y: staveTop,
                                        height: staveHeight
                                    });
                                    console.log(`Cursor Pos - TS: ${ts}, X: ${bbox.getX()}, Y: ${staveTop}, Height: ${staveHeight}`);
                                }
                            }
                        });

                        if (staffData.beams) {
                            staffData.beams.forEach((beam: any) => beam.setContext(this.ctx).draw());
                        }
                        if (staffData.vfTuplets) {
                            staffData.vfTuplets.forEach((t: any) => t.setContext(this.ctx).draw());
                        }

                        // Calculate visual bottom for system spacing
                        let staffVisualBottom = currentY + 100;
                        allNotes.forEach((note: any) => {
                            const bbox = note.getBoundingBox();
                             if (bbox) {
                                 staffVisualBottom = Math.max(staffVisualBottom, bbox.getY() + bbox.getH());
                             }
                             note.getModifiers().forEach((mod: any) => {
                                 if (mod.text_line) { 
                                     staffVisualBottom = Math.max(staffVisualBottom, currentY + 140); 
                                 }
                             });
                        });
                        maxSystemBottom = Math.max(maxSystemBottom, staffVisualBottom);
                    } else {
                        maxSystemBottom = Math.max(maxSystemBottom, currentY + 100);
                    }
                });

                // Connectors
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

            // Next System Y
            y = maxSystemBottom + 60;
        }

        if (curves) {
            curves.forEach(curve => curve.setContext(this.ctx).draw());
        }
        
        if (this.renderer.resize) {
            this.renderer.resize(this.container.clientWidth, y + 100);
        }

        return cursorPositions;
    }

    /**
     * Calculates the Y positions for each staff in a system to avoid collisions.
     */
    private calculateSystemLayout(system: any[]): number[] {
        if (system.length === 0) return [];
        const numStaves = system[0].staves.length;
        const offsets = [0];
        let currentOffset = 0;

        for (let i = 0; i < numStaves - 1; i++) {
            let maxRequiredDistance = 80; 

            for (const measure of system) {
                const upperStaff = measure.staves[i];
                const lowerStaff = measure.staves[i+1];

                const upperBottom = this.measureStaffBottom(upperStaff, measure.width);
                const lowerTop = this.measureStaffTop(lowerStaff, measure.width);

                const padding = 10;
                const distance = upperBottom - lowerTop + padding;
                
                maxRequiredDistance = Math.max(maxRequiredDistance, distance);
            }

            currentOffset += maxRequiredDistance;
            offsets.push(currentOffset);
        }
        return offsets;
    }

    private measureStaffBottom(staffData: any, width: number): number {
        let maxY = 80;
        const voiceIds = Object.keys(staffData.vfVoices || {});
        if (voiceIds.length === 0) return maxY;

        const { voices, allNotes } = this.createVoices(staffData);
        const dummyStave = new VF.Stave(0, 0, width); // Unused but maybe needed if VexFlow strict
        new VF.Formatter().joinVoices(voices).format(voices, width - 50);

        allNotes.forEach((note: any) => {
            note.keys.forEach((k: any, idx: number) => {
                const line = note.getKeyProps()[idx].line;
                const noteY = line * 10; 
                maxY = Math.max(maxY, noteY + 20); 
            });
            const hasLyrics = note.modifiers.some((m: any) => m.category === "annotation");
            if (hasLyrics) maxY += 30;
        });

        return maxY;
    }

    private measureStaffTop(staffData: any, width: number): number {
        let minY = 0; 
        const voiceIds = Object.keys(staffData.vfVoices || {});
        if (voiceIds.length === 0) return minY;

        const allNotes: any[] = [];
        for (const vid of voiceIds) allNotes.push(...staffData.vfVoices[vid]);

        allNotes.forEach((note: any) => {
            note.keys.forEach((k: any, idx: number) => {
                const line = note.getKeyProps()[idx].line;
                const noteY = line * 10;
                minY = Math.min(minY, noteY - 20);
            });
        });

        return minY;
    }

    private createVoices(staffData: any): { voices: any[], allNotes: any[] } {
        let numBeats = 4;
        let beatValue = 4;
        if (staffData.timeSignature) {
            const parts = staffData.timeSignature.split("/");
            numBeats = parseInt(parts[0]);
            beatValue = parseInt(parts[1]);
        }

        const voices: any[] = [];
        let allNotes: any[] = [];

        const voiceIds = Object.keys(staffData.vfVoices || {});
        for (const vid of voiceIds) {
            const notes = staffData.vfVoices[vid];
            const voice = new VF.Voice({ numBeats: numBeats, beatValue: beatValue });
            voice.setStrict(false);
            voice.addTickables(notes);
            voices.push(voice);
            allNotes.push(...notes);
        }
        return { voices, allNotes };
    }
}