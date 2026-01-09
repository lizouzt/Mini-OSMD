import * as VF from "vexflow";

export class VexFlowMusicSheetDrawer {
    constructor(container: HTMLElement) {
        this.container = container;
        // Only remove existing SVGs to preserve Cursor element
        const svgs = this.container.querySelectorAll("svg");
        svgs.forEach(svg => this.container.removeChild(svg));
        
        this.renderer = new VF.Renderer(container as HTMLDivElement, VF.Renderer.Backends.SVG);
        this.ctx = this.renderer.getContext();
    }

    private container: HTMLElement;
    private renderer: any;
    private ctx: any;

    public clear(): void {
        this.ctx.clear();
    }

    public draw(data: { systems: any[][], curves: any[] }, options: { darkMode?: boolean, zoom?: number } = {}): Map<number, { topY: number, botY: number }> {
        const { systems, curves } = data;
        const { darkMode, zoom = 1.0 } = options;

        this.ctx.clear();
        // Reset scale? VexFlow SVGContext doesn't have resetTransform easily.
        // But since we clear container in constructor, we should be creating a NEW Drawer on every render ideally.
        // If we reuse drawer, we risk accumulating state.
        // Assuming we reuse drawer:
        // Try to overwrite scale. 
        // VexFlow setScale usually sets a transform on the main group.
        // this.ctx.scale(zoom, zoom); // REMOVED: ViewBox scaling handles zoom. Double scaling caused whitespace.
        
        // Native Dark Mode Styling
        const color = darkMode ? "#FFFFFF" : "#000000";
        const style = { fillStyle: color, strokeStyle: color };

        this.ctx.setFillStyle(color);
        this.ctx.setStrokeStyle(color);

        // Remove CSS filters if any
        this.renderer.ctx.element.style.filter = "none";
        this.renderer.ctx.element.style.display = "block"; // Fix alignment issues

        const startX = 10;
        let x = startX;
        let y = 50; // Initial Top Margin
        
        // Map<MeasureNumber, Bounds>
        const measureBounds = new Map<number, { topY: number, botY: number }>();

        // Loop Systems
        for (const system of systems) {
            // 1. Calculate Vertical Layout for this System
            const staffYOffsets = this.calculateSystemLayout(system);
            
            // 2. Determine System Height
            let maxSystemBottom = 0;

            x = startX; 

            // 3. Draw Measures
            for (const measureData of system) {
                // Group Measure Elements (OSMD Structure Parity)
                if (this.ctx.openGroup) {
                    this.ctx.openGroup("vf-measure", `measure-${measureData.measureNumber}`);
                }

                // Global Formatting for Alignment
                const allVoicesInMeasure: any[] = [];
                measureData.staves.forEach((staffData: any) => {
                     const res = this.createVoices(staffData);
                     staffData.tempVoices = res.voices;
                     staffData.tempAllNotes = res.allNotes;
                     allVoicesInMeasure.push(...res.voices);
                });
                
                // Format ALL voices together (Stave Alignment)
                // Use safe width calculation (width - padding for modifiers)
                const formatWidth = Math.max(50, measureData.width - 60);
                if (allVoicesInMeasure.length > 0) {
                     new VF.Formatter().joinVoices(allVoicesInMeasure).format(allVoicesInMeasure, formatWidth);
                }

                const staves = measureData.staves;
                
                // Prepare VexFlow Staves
                const vfStaves: any[] = [];
                let measureTopY = Number.MAX_VALUE;
                let measureBotY = Number.MIN_VALUE;

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
                    
                    // Default to Single Barline if not specified (Standard Notation)
                    const endBarType = measureData.endBarLineType !== undefined ? measureData.endBarLineType : VF.Barline.type.SINGLE;
                    stave.setEndBarType(endBarType);
                    
                    if (staffData.label) {
                        stave.setText(staffData.label, VF.Modifier.Position.LEFT);
                        // Add padding for label?
                        // Stave.setText usually draws outside. We might need to adjust startX if it's too long.
                        // But for now let's just draw it.
                    }
                    
                    if (staffData.voltaType !== undefined && staffData.voltaType !== VF.Volta.type.NONE) {
                        stave.setVoltaType(staffData.voltaType, staffData.voltaNumber || "1", 0);
                    }

                    // Ensure Context Style for Stave
                    this.ctx.setFillStyle(color);
                    this.ctx.setStrokeStyle(color);
                    stave.setContext(this.ctx).draw();
                    vfStaves.push(stave);

                    // Track bounds for this system/measure vertical slice
                    // Stave Top = line 0
                    // Stave Bot = last line
                    const sTop = stave.getY();
                    const sBot = stave.getBottomY();
                    if (sTop < measureTopY) measureTopY = sTop;
                    if (sBot > measureBotY) measureBotY = sBot;

                    const voiceIds = Object.keys(staffData.vfVoices || {});
                    
                    if (voiceIds.length > 0) {
                        // Use Pre-Formatted Voices
                        const voices = staffData.tempVoices || [];
                        const allNotes = staffData.tempAllNotes || [];
                        
                        // Apply Style to Notes (Fixes Stems)
                        allNotes.forEach((note: any) => {
                            if (note.setStyle) note.setStyle(style);
                            if (note.setStemStyle) note.setStemStyle(style);
                            if (note.setLedgerLineStyle) note.setLedgerLineStyle(style);
                        });
                        
                        // Formatting already done globally!
                        
                        voices.forEach((v: any) => v.draw(this.ctx, stave));
                        
                        // Manually Draw Lyrics (Aligned Baseline)
                        allNotes.forEach((note: any) => {
                             const sourceNote = (note as any).sourceNote;
                             if (sourceNote && sourceNote.lyrics && sourceNote.lyrics.length > 0) {
                                 const lyric = sourceNote.lyrics[0]; // Draw first verse
                                 const text = lyric.text + (lyric.syllabic === "begin" || lyric.syllabic === "middle" ? "-" : "");
                                 
                                 // Position
                                 const noteX = note.getAbsoluteX(); 
                                 const lyricsY = stave.getBottomY() + 35; // Fixed Baseline
                                 
                                 // Simple centering estimate
                                 const estimatedWidth = text.length * 4; 
                                 
                                 this.ctx.setFont("Times", 12, "normal"); // Ensure font
                                 this.ctx.fillText(text, noteX - estimatedWidth, lyricsY);
                             }
                        });
                        
                        if (staffData.beams) {
                            staffData.beams.forEach((beam: any) => {
                                if (beam.setStyle) beam.setStyle(style);
                                if (beam.render_options) beam.render_options.beam_width = 2;
                                beam.setContext(this.ctx).draw();
                            });
                        }
                        if (staffData.vfTuplets) {
                            staffData.vfTuplets.forEach((t: any) => {
                                this.ctx.setFillStyle(color);
                                this.ctx.setStrokeStyle(color);
                                t.setContext(this.ctx).draw();
                            });
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

                // Connectors (Left side of system)
                if (vfStaves.length > 1 && x === startX) {
                     this.ctx.setStrokeStyle(color);
                     this.ctx.setFillStyle(color);
                     const connector = new VF.StaveConnector(vfStaves[0], vfStaves[vfStaves.length - 1]);
                     connector.setType(VF.StaveConnector.type.BRACE);
                     connector.setContext(this.ctx).draw();
                     
                     const lineConnector = new VF.StaveConnector(vfStaves[0], vfStaves[vfStaves.length - 1]);
                     lineConnector.setType(VF.StaveConnector.type.SINGLE_LEFT);
                     lineConnector.setContext(this.ctx).draw();
                }

                // Closing System Connector (Right side of system)
                const isLastMeasure = system.indexOf(measureData) === system.length - 1;
                if (isLastMeasure && vfStaves.length > 1) {
                    const topStave = vfStaves[0];
                    const botStave = vfStaves[vfStaves.length - 1];
                    const lineX = topStave.getX() + topStave.getWidth();
                    const topY = topStave.getYForLine(0);
                    const botY = botStave.getYForLine(botStave.getNumLines() - 1);
                    
                    this.ctx.beginPath();
                    this.ctx.setStrokeStyle(color);
                    this.ctx.setLineWidth(1.5);
                    this.ctx.moveTo(lineX, topY);
                    this.ctx.lineTo(lineX, botY);
                    this.ctx.stroke();
                }

                // Store measure bounds (system-wide)
                measureBounds.set(measureData.measureIndex, { 
                    topY: measureTopY, 
                    botY: measureBotY 
                });

                if (this.ctx.closeGroup) {
                    this.ctx.closeGroup();
                }

                x += measureData.width;
            }

            // Next System Y
            y = maxSystemBottom + 60;
        }

        if (curves) {
            this.ctx.setStrokeStyle(color);
            this.ctx.setFillStyle(color);
            curves.forEach(curve => {
                curve.setContext(this.ctx).draw();
            });
        }
        
        if (this.renderer.resize) {
            // Fix Zoom: Use ViewBox scaling instead of Context scaling to prevent double-scale / whitespace
            const visualWidth = this.container.clientWidth;
            const logicalHeight = y + 50; // Use actual content height logic
            const visualHeight = logicalHeight * zoom;
            
            // Set SVG attributes (visual size)
            this.renderer.resize(visualWidth, visualHeight);
            
            // Set ViewBox (logical size)
            const logicalWidth = visualWidth / zoom;
            this.ctx.svg.setAttribute("viewBox", `0 0 ${logicalWidth} ${logicalHeight}`);
        }

        return measureBounds;
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
            let maxRequiredDistance = 100; // Increased fixed minimum distance for consistency (OSMD-like)

            for (const measure of system) {
                const upperStaff = measure.staves[i];
                const lowerStaff = measure.staves[i+1];

                const upperBottom = this.measureStaffBottom(upperStaff, measure.width);
                const lowerTop = this.measureStaffTop(lowerStaff, measure.width);

                const padding = 15;
                const distance = upperBottom - lowerTop + padding;
                
                // Only expand if content necessitates it
                if (distance > maxRequiredDistance) {
                    maxRequiredDistance = distance;
                }
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
        const dummyStave = new VF.Stave(0, 0, width); 
        new VF.Formatter().joinVoices(voices).format(voices, width - 50);

        allNotes.forEach((note: any) => {
            note.keys.forEach((k: any, idx: number) => {
                const line = note.getKeyProps()[idx].line;
                const noteY = line * 10; 
                maxY = Math.max(maxY, noteY + 20); 
            });
            const sourceNote = (note as any).sourceNote;
            const hasLyrics = sourceNote && sourceNote.lyrics && sourceNote.lyrics.length > 0;
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
            voice.addTickables(notes);
            voices.push(voice);
            allNotes.push(...notes);
        }
        return { voices, allNotes };
    }
}