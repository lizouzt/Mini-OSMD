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
        let y = 50; // Initial Top Margin

        // Loop Systems
        for (const system of systems) {
            // 1. Calculate Vertical Layout for this System
            // We need to determine the Y-offset for each staff index [0, 1, 2...]
            const staffYOffsets = this.calculateSystemLayout(system);
            
            // 2. Determine System Height (Last Staff Y + Last Staff Bottom Padding)
            // We'll update this as we draw
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

                    stave.setContext(this.ctx).draw();
                    vfStaves.push(stave);

                    // Draw Voices (Reuse logic or cached?)
                    // For now, we recreate. Performance is fine for mini-osmd.
                    const voiceIds = Object.keys(staffData.vfVoices || {});
                    
                    if (voiceIds.length > 0) {
                        const { voices, allNotes } = this.createVoices(staffData);
                        
                        // Format to width
                        const formatter = new VF.Formatter().joinVoices(voices).format(voices, measureData.width - 50);
                        
                        voices.forEach((v: any) => v.draw(this.ctx, stave));
                        
                        if (staffData.beams) {
                            staffData.beams.forEach((beam: any) => beam.setContext(this.ctx).draw());
                        }
                        if (staffData.vfTuplets) {
                            staffData.vfTuplets.forEach((t: any) => t.setContext(this.ctx).draw());
                        }

                        // Calculate visual bottom for system spacing
                        // We check notes (and lyrics) to see how far down they go
                        let staffVisualBottom = currentY + 100; // default stave height approx
                        allNotes.forEach((note: any) => {
                            const bbox = note.getBoundingBox();
                             if (bbox) {
                                 staffVisualBottom = Math.max(staffVisualBottom, bbox.getY() + bbox.getH());
                             }
                             // Modifiers (like Lyrics)
                             note.getModifiers().forEach((mod: any) => {
                                 // VexFlow 1.x Annotation BBox might be tricky, but let's try
                                 if (mod.getBoundingBox) { // standard check
                                    // BoundingBox might be relative or absolute depending on implementation
                                 }
                                 // Workaround: TextDynamics or Annotation
                                 if (mod.text_line) { // It is an annotation
                                     // Estimate height (font size 12 ~ 15px)
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
            y = maxSystemBottom + 60; // Padding between systems
        }

        // Draw Curves
        if (curves) {
            curves.forEach(curve => curve.setContext(this.ctx).draw());
        }
        
        // Resize Container
        if (this.renderer.resize) {
            this.renderer.resize(this.renderer.element.clientWidth, y + 100);
        }
    }

    /**
     * Calculates the Y positions for each staff in a system to avoid collisions.
     * Returns an array of relative Y offsets (e.g. [0, 150, 260]).
     */
    private calculateSystemLayout(system: any[]): number[] {
        if (system.length === 0) return [];
        const numStaves = system[0].staves.length;
        const offsets = [0];
        
        // Accumulate height
        let currentOffset = 0;

        for (let i = 0; i < numStaves - 1; i++) {
            // Calculate required distance between Staff i and Staff i+1
            let maxRequiredDistance = 100; // Minimum default distance

            // Iterate ALL measures in this system to find the "worst case" collision
            for (const measure of system) {
                const upperStaff = measure.staves[i];
                const lowerStaff = measure.staves[i+1];

                // 1. Measure Upper Staff "Bottom Line" (lowest pixel relative to stave top)
                const upperBottom = this.measureStaffBottom(upperStaff, measure.width);
                
                // 2. Measure Lower Staff "Sky Line" (highest pixel relative to stave top)
                // Note: SkyLine is usually negative (notes above the staff) or small positive.
                const lowerTop = this.measureStaffTop(lowerStaff, measure.width);

                // 3. Calculate Gap
                // We want: (LowerStaffY + LowerTop) > (UpperStaffY + UpperBottom) + Padding
                // LowerStaffY - UpperStaffY > UpperBottom - LowerTop + Padding
                // Required Distance = UpperBottom - LowerTop + Padding
                const padding = 40;
                const distance = upperBottom - lowerTop + padding;
                
                maxRequiredDistance = Math.max(maxRequiredDistance, distance);
            }

            currentOffset += maxRequiredDistance;
            offsets.push(currentOffset);
        }

        return offsets;
    }

    private measureStaffBottom(staffData: any, width: number): number {
        // Create dummy stave and format to get bounding boxes
        // We use a simplified check: 
        // 1. Stave Bottom Line is at Y=100 (5 lines * 10 spacing + margins) -> Actually VexFlow stave is ~100px high
        // 2. Check notes descending below.
        
        // Base bottom (5th line) is roughly at 100px? 
        // VexFlow: Line 0 is top. Line 4 is bottom. Spacing 10.
        // So Line 4 is at 40px. 
        // Stave bounding box usually considers roughly 0 to 100 including modifiers.
        let maxY = 80; // Default reasonable bottom for empty stave (includes space for time sig etc)

        const voiceIds = Object.keys(staffData.vfVoices || {});
        if (voiceIds.length === 0) return maxY;

        const { voices, allNotes } = this.createVoices(staffData);
        // We must format to get positions. We use a dummy stave at 0,0.
        // VexFlow requires a Stave for formatting usually (to know width/constraints).
        const dummyStave = new VF.Stave(0, 0, width);
        new VF.Formatter().joinVoices(voices).format(voices, width - 50);

        // Check Note positions
        // Note: Y values in StaveNote are relative to the Stave's Y.
        // Since dummyStave is at 0, these are "Relative Y".
        
        allNotes.forEach((note: any) => {
            // Note: getBoundingBox might require the note to be drawn or at least formatted.
            // In VexFlow 3, format() calculates X. setStave() calculates Y? 
            // We might need to manually check `note.getKeyProps()[0].line`.
            // But let's try retrieving standard properties.
            
            // Heuristic for Performance:
            // Check 'line' of the note. Higher line number = lower on screen.
            // Line 5 = 1st ledger line below.
            // Line 0 = Top line.
            
            note.keys.forEach((k: any, idx: number) => {
                const line = note.getKeyProps()[idx].line;
                // Line 4 is bottom line.
                // Each line step is 5 pixels (half space) or 10? VexFlow space is 10px usually.
                // Y = line * 10 (approx).
                const noteY = line * 10; 
                maxY = Math.max(maxY, noteY + 20); // +20 for notehead/stem buffer
            });
            
            // Dynamics/Lyrics usually sit below.
            // If note has lyrics, add buffer.
            const hasLyrics = note.modifiers.some((m: any) => m.category === "annotation"); // crude check
            if (hasLyrics) maxY += 30;
        });

        return maxY;
    }

    private measureStaffTop(staffData: any, width: number): number {
        // We want the HIGHEST point (Lowest Y value).
        // Stave Top Line is Y=0 (Line 0).
        let minY = 0; // Default top

        const voiceIds = Object.keys(staffData.vfVoices || {});
        if (voiceIds.length === 0) return minY;

        // Same dummy format logic... 
        // Actually, we can just inspect note lines without formatting for "vertical" info,
        // because vertical info is mostly Pitch-dependent (KeyProps).
        // Formatting is for Horizontal.
        
        const allNotes: any[] = [];
        for (const vid of voiceIds) allNotes.push(...staffData.vfVoices[vid]);

        allNotes.forEach((note: any) => {
            note.keys.forEach((k: any, idx: number) => {
                const line = note.getKeyProps()[idx].line;
                // Line 0 is top line. Negative line is above.
                const noteY = line * 10;
                minY = Math.min(minY, noteY - 20); // -20 buffer for stems going up
            });
            
            // Markings above (Octave Shift, etc - processed elsewhere or here?)
            // We assume standard notes for now.
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
            const voice = new VF.Voice({ num_beats: numBeats, beat_value: beatValue });
            voice.addTickables(notes);
            voices.push(voice);
            allNotes.push(...notes);
        }
        return { voices, allNotes };
    }
}