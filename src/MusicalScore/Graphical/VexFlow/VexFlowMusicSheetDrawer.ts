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
                    this.ctx.openGroup("measure", `measure-${measureData.measureNumber}`);
                }

                // --- Hybrid Strategy: Try Global Formatting, Fallback to Per-Staff ---
                let globalFormatSuccess = false;
                const allVoicesInMeasure: any[] = [];
                // We need to cache voices to reuse them (avoid re-creating)
                measureData.staves.forEach((staffData: any) => {
                    const res = this.createVoices(staffData, measureData.maxTicks);
                    staffData.tempVoices = res.voices;
                    staffData.tempAllNotes = res.allNotes;
                    allVoicesInMeasure.push(...res.voices);
                });

                const globalWidth = Math.max(50, measureData.width - 60); // Approx width

                if (allVoicesInMeasure.length > 0) {
                    try {
                        new VF.Formatter().joinVoices(allVoicesInMeasure).format(allVoicesInMeasure, globalWidth);
                        globalFormatSuccess = true;
                    } catch (e) {
                        console.warn(`[Layout] Measure ${measureData.measureNumber}: Global alignment failed. Fallback to per-staff.`, e);
                        // Detailed Diagnosis
                        allVoicesInMeasure.forEach((v: any, i) => {
                            try {
                                const ticks = v.ticksUsed ? v.ticksUsed.value() : "N/A";
                                const total = v.totalTicks ? v.totalTicks.value() : "N/A";
                                console.warn(`Voice ${i}: ActualTicks=${ticks}, Expected=${total}, NoteCount=${v.getTickables().length}`);
                            } catch (err) {
                                console.warn(`Voice ${i} error`, err);
                            }
                        });
                    }
                }
                // ---------------------------------------------------------------------

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
                        // Use CACHED voices (from Global attempt) or create new if not cached (should be cached)
                        const voices = staffData.tempVoices || [];
                        const allNotes = staffData.tempAllNotes || [];

                        // Apply Style to Notes (Fixes Stems)
                        allNotes.forEach((note: any) => {
                            if (note.setStyle) note.setStyle(style);
                            if (note.setStemStyle) note.setStemStyle(style);
                            if (note.setLedgerLineStyle) note.setLedgerLineStyle(style);
                        });

                        // Fallback Formatting: If Global failed, format HERE.
                        if (!globalFormatSuccess) {
                            // Dynamic width calculation based on Stave's actual modifier width
                            const noteStartX = stave.getNoteStartX();
                            const startOffset = noteStartX - stave.getX();
                            const availableWidth = Math.max(50, measureData.width - startOffset - 10);

                            try {
                                new VF.Formatter().joinVoices(voices).format(voices, availableWidth);
                            } catch (e) {
                                console.warn(`[Layout] Measure ${measureData.measureNumber} Staff ${index}: Per-staff alignment failed. Trying simplistic format.`);
                                new VF.Formatter().format(voices, availableWidth); // Last resort: no join
                            }
                        }

                        voices.forEach((v: any) => v.draw(this.ctx, stave));

                        if (staffData.beams) {
                            staffData.beams.forEach((beam: any) => {
                                if (beam.setStyle) beam.setStyle(style);
                                if (beam.render_options) beam.render_options.beam_width = 2;
                                try {
                                    beam.setContext(this.ctx).draw();
                                } catch (e) {
                                    console.warn(`[Beam Draw Error] Staff ${index} Beam Error:`, e);
                                    if (beam.notes) {
                                        beam.notes.forEach((n: any, i: number) => {
                                            console.warn(`Node ${i}:`, n.getCategory ? n.getCategory() : 'unknown', n);
                                        });
                                    }
                                }
                            });
                        }
                        if (staffData.vfTuplets) {
                            staffData.vfTuplets.forEach((t: any) => {
                                this.ctx.setFillStyle(color);
                                this.ctx.setStrokeStyle(color);
                                try {
                                    t.setContext(this.ctx).draw();
                                } catch (e) {
                                    console.warn(`[Tuplet Draw Error] Staff ${index} Tuplet Error:`, e);
                                    if (t.notes) {
                                        t.notes.forEach((n: any, i: number) => {
                                            console.warn(`Tuplet Node ${i}:`, n.getCategory ? n.getCategory() : 'unknown', n);
                                        });
                                    }
                                }
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

                x += measureData.width;
            }

            // Next System Y
            y = maxSystemBottom + 60;
        }

        if (curves) {
            this.ctx.setStrokeStyle(color);
            this.ctx.setFillStyle(color);
            curves.forEach(curve => {
                try {
                    curve.setContext(this.ctx).draw();
                } catch (e) {
                    console.warn(`[Curve Draw Error] Curve Error:`, e);
                }
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
            let maxRequiredDistance = 80;

            for (const measure of system) {
                const upperStaff = measure.staves[i];
                const lowerStaff = measure.staves[i + 1];

                const upperBottom = this.measureStaffBottom(upperStaff, measure.width, measure.maxTicks);
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

    private measureStaffBottom(staffData: any, width: number, maxTicks: number = 0): number {
        let maxY = 80;
        const voiceIds = Object.keys(staffData.vfVoices || {});
        if (voiceIds.length === 0) return maxY;

        const { voices, allNotes } = this.createVoices(staffData, maxTicks);
        const dummyStave = new VF.Stave(0, 0, width);
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

    private createVoices(staffData: any, maxTicks: number = 0): { voices: any[], allNotes: any[] } {
        let numBeats = 4;
        let beatValue = 4;
        if (maxTicks > 0) {
            // Normalize capacity to maxTicks
            numBeats = maxTicks / 4096;
        } else if (staffData.timeSignature) {
            const parts = staffData.timeSignature.split("/");
            numBeats = parseInt(parts[0]);
            beatValue = parseInt(parts[1]);
        }

        const voices: any[] = [];
        let allNotes: any[] = [];

        const voiceIds = Object.keys(staffData.vfVoices || {});
        for (const vid of voiceIds) {
            const notes = staffData.vfVoices[vid] || [];

            // PADDING STRATEGY (Duplicated from Calculator)
            let currentTicks = 0;
            notes.forEach((note: any) => {
                const t = note.ticks ? note.ticks.value() : 0;
                currentTicks += t;
            });

            const voiceNotes = [...notes]; // Copy to avoid mutating original repeatedly if re-called

            if (maxTicks > 0 && currentTicks < maxTicks) {
                const diff = maxTicks - currentTicks;
                const ghost = new VF.GhostNote({ duration: "b" });
                if ((ghost as any).setTicks) {
                    (ghost as any).setTicks(new VF.Fraction(diff, 1));
                } else {
                    (ghost as any).ticks = new VF.Fraction(diff, 1);
                }
                voiceNotes.push(ghost);
            }

            const voice = new VF.Voice({ numBeats: numBeats, beatValue: beatValue });
            voice.setStrict(false);
            voice.addTickables(voiceNotes);
            voices.push(voice);
            allNotes.push(...notes); // Don't include ghost notes in allNotes for drawing? GhostNotes draw nothing anyway.
        }
        return { voices, allNotes };
    }
}