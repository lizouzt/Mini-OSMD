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

    private drawTitleAndComposer(metadata: { title: string | undefined, composer: string | undefined }, startY: number, color: string): number {
        let currentY = startY;
        const width = this.container.clientWidth || 1000; // Use container width
        const centerX = width / 2;

        this.ctx.save();
        this.ctx.setFillStyle(color); // Explicitly set color

        if (metadata.title) {
            this.ctx.setFont("Times New Roman", 32, "bold");
            // Measure Text (Approximate if measureText not available, but VF usually has it)
            let textWidth = 200;
            if (this.ctx.measureText) {
                textWidth = this.ctx.measureText(metadata.title).width;
            }
            this.ctx.fillText(metadata.title, centerX - (textWidth / 2), currentY);
            currentY += 40;
        }

        if (metadata.composer) {
            this.ctx.setFont("Times New Roman", 16, "italic");
            let textWidth = 100;
            if (this.ctx.measureText) {
                textWidth = this.ctx.measureText(metadata.composer).width;
            }
            this.ctx.fillText(metadata.composer, width - textWidth - 50, currentY);
            currentY += 20;
        }

        this.ctx.restore();
        return currentY + 20; // Add padding
    }

    public clear(): void {
        this.ctx.clear();
    }

    public draw(data: { systems: any[][], curves: any[], systemStaffCurves?: Map<number, Map<number, any[]>>, partGroups?: any[], metadata?: { title: string | undefined, composer: string | undefined } }, options: { darkMode?: boolean, zoom?: number } = {}): Map<number, { topY: number, botY: number }> {
        const { systems, curves, systemStaffCurves, partGroups, metadata } = data;
        const { darkMode, zoom = 1.0 } = options;

        this.ctx.clear();

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

        if (metadata) {
            y = this.drawTitleAndComposer(metadata, y, color);
        }

        // Map<MeasureNumber, Bounds>
        const measureBounds = new Map<number, { topY: number, botY: number }>();

        // Loop Systems
        for (let sysIdx = 0; sysIdx < systems.length; sysIdx++) {
            const system = systems[sysIdx];
            const currentSysCurves = systemStaffCurves?.get(sysIdx);

            // 1. Calculate Vertical Layout for this System
            const staffYOffsets = this.calculateSystemLayout(system, currentSysCurves);

            // 2. Determine System Height
            let maxSystemBottom = 0;

            x = startX;

            // 3. Draw Measures
            for (const measureData of system) {
                // Group Measure Elements (OSMD Structure Parity)
                if (this.ctx.openGroup) {
                    this.ctx.openGroup("measure", `measure-${measureData.measureNumber}`);
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

                    // Default to Single Barline if not specified
                    const endBarType = measureData.endBarLineType !== undefined ? measureData.endBarLineType : VF.Barline.type.SINGLE;
                    stave.setEndBarType(endBarType);

                    if (staffData.voltaType !== undefined && staffData.voltaType !== VF.Volta.type.NONE) {
                        stave.setVoltaType(staffData.voltaType, staffData.voltaNumber || "1", 0);
                    }

                    vfStaves.push(stave);
                });

                // --- ALIGNMENT FIX: Synchronize NoteStartX across all staves ---
                let maxNoteStartX = 0;
                vfStaves.forEach(stave => {
                    // We need to format the stave to calculate modifiers (VexFlow does this implicitly on draw, but we can call it)
                    // But we haven't drawn yet. format() calculates x positions of modifiers.
                    stave.format();
                    if (stave.getNoteStartX() > maxNoteStartX) {
                        maxNoteStartX = stave.getNoteStartX();
                    }
                });

                vfStaves.forEach(stave => stave.setNoteStartX(maxNoteStartX));

                // Now Draw Staves and Voices
                vfStaves.forEach((stave, index) => {
                    this.ctx.setFillStyle(color);
                    this.ctx.setStrokeStyle(color);
                    stave.setContext(this.ctx).draw();

                    // Track bounds
                    const sTop = stave.getY();
                    const sBot = stave.getBottomY();
                    if (sTop < measureTopY) measureTopY = sTop;
                    if (sBot > measureBotY) measureBotY = sBot;

                    // Prepare Voices
                    const staffData = staves[index];
                    const voiceIds = Object.keys(staffData.vfVoices || {});
                    if (voiceIds.length > 0) {
                        const res = this.createVoices(staffData, measureData.maxTicks);
                        staffData.tempVoices = res.voices;
                        staffData.tempAllNotes = res.allNotes;
                    }
                });

                // Collect All Voices for Global Formatting
                const allVoicesInMeasure: any[] = [];
                staves.forEach((staffData: any) => {
                    if (staffData.tempVoices) {
                        allVoicesInMeasure.push(...staffData.tempVoices);
                    }
                });

                // Global Formatting
                let globalFormatSuccess = false;
                if (allVoicesInMeasure.length > 0) {
                    try {
                        // Available width depends on the new aligned NoteStartX
                        const availWidth = Math.max(50, measureData.width - (maxNoteStartX - x) - 10);
                        new VF.Formatter().joinVoices(allVoicesInMeasure).format(allVoicesInMeasure, availWidth);
                        globalFormatSuccess = true;
                    } catch (e) {
                        console.warn(`[Layout] Measure ${measureData.measureNumber}: Global alignment failed.`, e);
                    }
                }

                // Draw Voices
                vfStaves.forEach((stave, index) => {
                    const staffData = staves[index];
                    const voices = staffData.tempVoices;
                    const allNotes = staffData.tempAllNotes;

                    if (voices && voices.length > 0) {
                        // Apply Style
                        allNotes.forEach((note: any) => {
                            if (note.setStyle) note.setStyle(style);
                            if (note.setStemStyle) note.setStemStyle(style);
                            if (note.setLedgerLineStyle) note.setLedgerLineStyle(style);
                        });

                        // Fallback Formatting
                        if (!globalFormatSuccess) {
                            const noteStartX = stave.getNoteStartX(); // Should be maxNoteStartX now
                            const startOffset = noteStartX - stave.getX();
                            const availableWidth = Math.max(50, measureData.width - startOffset - 10);
                            try {
                                new VF.Formatter().joinVoices(voices).format(voices, availableWidth);
                            } catch (e) {
                                new VF.Formatter().format(voices, availableWidth);
                            }
                        }

                        // Force Apply Stem Direction
                        voices.forEach((v: any) => {
                            v.getTickables().forEach((t: any) => {
                                if (t.sourceNote && t.sourceNote.stemDirectionXml) {
                                    if (t.sourceNote.stemDirectionXml === "up") t.setStemDirection(VF.Stem.UP);
                                    else if (t.sourceNote.stemDirectionXml === "down") t.setStemDirection(VF.Stem.DOWN);
                                }
                            });
                        });

                        voices.forEach((v: any) => v.draw(this.ctx, stave));

                        // Draw Tuplets (Beams moved to Global Measure Level)
                        // if (staffData.beams) ... REMOVED
                        if (staffData.vfTuplets) {
                            staffData.vfTuplets.forEach((t: any) => {
                                this.ctx.setFillStyle(color);
                                this.ctx.setStrokeStyle(color);
                                try { t.setContext(this.ctx).draw(); } catch (e) { }
                            });
                        }

                        // Calculate visual bottom for system spacing (System Logic remains similar)
                        let staffVisualBottom = stave.getY() + 100;
                        // ... (simplified check for height)
                        maxSystemBottom = Math.max(maxSystemBottom, staffVisualBottom);
                    } else {
                        maxSystemBottom = Math.max(maxSystemBottom, stave.getY() + 100);
                    }
                });

                // DRAW CROSS-STAFF BEAMS (Global for Measure)
                // Draw after all staves/voices in measure are rendered so stems are ready.
                if (measureData.beams) {
                    measureData.beams.forEach((beam: any) => {
                        if (beam.setStyle) beam.setStyle(style);
                        this.ctx.setFillStyle(color);
                        this.ctx.setStrokeStyle(color);
                        try { beam.setContext(this.ctx).draw(); } catch (e) {
                            console.warn("Beam draw error", e);
                        }
                    });
                }

                // Connectors (Left side of system)
                if (x === startX) {
                    // Check for Part Groups and Draw Connectors
                    if (partGroups) {
                        partGroups.forEach(group => {
                            const startIdx = group.startStaffId - 1;
                            const endIdx = group.endStaffId - 1;

                            // Check bounds
                            if (startIdx >= 0 && endIdx < vfStaves.length && startIdx <= endIdx) {
                                const topStave = vfStaves[startIdx];
                                const bottomStave = vfStaves[endIdx];

                                let type = VF.StaveConnector.type.BRACE;
                                if (group.groupSymbol === "bracket") type = VF.StaveConnector.type.BRACKET;
                                else if (group.groupSymbol === "brace") type = VF.StaveConnector.type.BRACE;
                                else if (group.groupSymbol === "line") type = VF.StaveConnector.type.SINGLE_LEFT;
                                else if (group.groupSymbol === "square") type = VF.StaveConnector.type.SINGLE_LEFT;

                                const connector = new VF.StaveConnector(topStave, bottomStave);
                                connector.setType(type);
                                this.ctx.setFillStyle(color);
                                this.ctx.setStrokeStyle(color);
                                connector.setContext(this.ctx).draw();
                            }
                        });
                    }

                    // Always draw SingleLine connecting all staves of the system (standard)
                    if (vfStaves.length > 1) {
                        const lineConnector = new VF.StaveConnector(vfStaves[0], vfStaves[vfStaves.length - 1]);
                        lineConnector.setType(VF.StaveConnector.type.SINGLE_LEFT);
                        this.ctx.setFillStyle(color);
                        this.ctx.setStrokeStyle(color);
                        lineConnector.setContext(this.ctx).draw();
                    }
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
    private calculateSystemLayout(system: any[], systemCurves?: Map<number, any[]>): number[] {
        if (system.length === 0) return [];
        const numStaves = system[0].staves.length;
        const offsets = [0];
        let currentOffset = 0;

        for (let i = 0; i < numStaves - 1; i++) {
            let maxOverlap = 60; // Default minimum distance (e.g. 6 lines)

            for (const measure of system) {
                const upperStaff = measure.staves[i];
                const lowerStaff = measure.staves[i + 1];

                const upperCurves = systemCurves?.get(i) || [];
                const lowerCurves = systemCurves?.get(i + 1) || [];

                const upperContours = this.computeStaffContours(upperStaff, measure.width, measure.maxTicks, upperCurves);
                const lowerContours = this.computeStaffContours(lowerStaff, measure.width, measure.maxTicks, lowerCurves);

                // Calculate Max Overlap across the width
                // Note: contours are based on 10px resolution
                const len = Math.min(upperContours.bottomLine.length, lowerContours.skyline.length);

                for (let x = 0; x < len; x++) {
                    // Distance needed = UpperBottom - LowerSkyline
                    // Example: Upper bottom at +30. Lower top at -20. Distance needed: 30 - (-20) = 50.
                    const dist = upperContours.bottomLine[x] - lowerContours.skyline[x];
                    maxOverlap = Math.max(maxOverlap, dist);
                }
            }

            const padding = 20;
            currentOffset += maxOverlap + padding;
            offsets.push(currentOffset);
        }
        return offsets;
    }

    private computeStaffContours(staffData: any, width: number, maxTicks: number, curves: any[] = []): { skyline: number[], bottomLine: number[] } {
        const resolution = 10;
        const numSamples = Math.ceil(width / resolution);
        // Default: Top/Bottom of Staff (approx 0 to 80 for 5 lines with 10 spacing)
        // VF Stave: Y=0 is top line? No, Y relative to stave. 
        // We assume Stave Top Y = 0 locally. 
        const skyline = new Array(numSamples).fill(0); // Top Line
        const bottomLine = new Array(numSamples).fill(40); // Bottom Line (4 spaces * 10)

        const voiceIds = Object.keys(staffData.vfVoices || {});
        if (voiceIds.length === 0) return { skyline, bottomLine };

        const { voices, allNotes } = this.createVoices(staffData, maxTicks);
        // Format to get X positions
        // Note: This relies on the fact that formatting is deterministic and relative X matches final render
        new VF.Formatter().joinVoices(voices).format(voices, width - 20); // Width - Padding

        // Helper to update contour
        const updateContour = (x: number, y: number, w: number, h: number) => {
            const startIdx = Math.max(0, Math.floor(x / resolution));
            const endIdx = Math.min(numSamples - 1, Math.floor((x + w) / resolution));

            for (let i = startIdx; i <= endIdx; i++) {
                // Skyline: MIN Y (Higher up is smaller Y)
                skyline[i] = Math.min(skyline[i], y);
                // BottomLine: MAX Y (Lower down is larger Y)
                bottomLine[i] = Math.max(bottomLine[i], y + h);
            }
        };

        allNotes.forEach((note: any) => {
            // Note X is relative to Stave X (which is 0 here)
            // Note Y? 
            // VexFlow notes don't provide easy absolute Y without Stave.
            // But we can calculate from Keys/Line.
            // Line 0 = Top Line. Line 4 = Bottom Line. Line Spacing = 10.
            // Y = Line * 10.

            // 1. Noteheads
            // Simplify: use note.getAttribute("x") if available? No.
            // Use formatted X (note.getAbsoluteX() is for current TickContext?)
            // note.getNoteHeadBounds() might necessitate drawing?
            // Fallback: note.getAbsoluteX() comes from TickContext.
            // But Formatter usually sets `x` properties or modifiers on TickContext.

            // Let's use `note.getAbsoluteX()` if available, else approximate.
            // `Formatter` sets `x` on `TickContext` but maybe not individual notes directly?
            // Actually `note.getStave()` is null here.
            // We use `note.getTickContext().getX()`.
            const tickContext = note.getTickContext();
            if (!tickContext) return;
            const noteX = tickContext.getX();

            // Calculate Y Extents
            let minY = 0;
            let maxY = 40;

            // Keys
            note.keys.forEach((k: any, idx: number) => {
                const line = note.getKeyProps()[idx].line;
                const y = line * 10;
                minY = Math.min(minY, y - 10); // Notehead margin
                maxY = Math.max(maxY, y + 10);
            });

            // Stem (Direction?)
            // Safe check for Stem
            if (note instanceof VF.StaveNote) {
                const stemLen = 35; // Approx
                try {
                    const stemDir = note.getStemDirection();
                    if (stemDir === VF.Stem.UP) minY = Math.min(minY, -10 - stemLen); // Top note - stem
                    else maxY = Math.max(maxY, 40 + stemLen); // Bottom note + stem (Simplified)
                } catch (e) {
                    // Ignore NoStem errors
                }
            }

            // Modifiers (Lyrics, Dynamics, Annotations)
            // Modifiers (Lyrics, Dynamics, Annotations)
            note.modifiers.forEach((m: any) => {
                let modWidth = 20; // Default
                if (m.getWidth) modWidth = m.getWidth();
                else if (m.text) modWidth = m.text.length * 6; // Approx

                // Centered on NoteX
                const modX = noteX - (modWidth / 2);

                if (m.category === "annotation" || m.category === "text") {
                    // Check Vertical Justification
                    // VF.Annotation.VerticalJustify: TOP=1, CENTER=2, BOTTOM=3, CENTER_STEM=4
                    let isBottom = true;
                    if (m.getVerticalJustification) {
                        const just = m.getVerticalJustification();
                        if (just === VF.Annotation.VerticalJustify.TOP) isBottom = false;
                    }

                    if (isBottom) {
                        // Update BottomLine for this modifier
                        updateContour(modX, maxY, modWidth, 25);
                        maxY += 25; // Stack? Simple approximation
                    } else {
                        // Update Skyline for this modifier
                        updateContour(modX, minY - 25, modWidth, 25);
                        minY -= 25;
                    }
                }
            });

            // Update for Notehead/Stem
            updateContour(noteX, minY, 20, maxY - minY);
        });

        // 6. Include Slurs, Ties, Wedges (High-Level Curves)
        const updateForCurve = (curve: any) => {
            try {
                let startNote: any, endNote: any;
                const anyCurve = curve as any;

                // Identify Start/End Notes from VexFlow Objects
                if (anyCurve.from && anyCurve.to) { // VF.Curve
                    startNote = anyCurve.from;
                    endNote = anyCurve.to;
                } else if (anyCurve.first_note && anyCurve.last_note) { // VF.StaveTie / VF.StaveHairpin
                    startNote = anyCurve.first_note;
                    endNote = anyCurve.last_note;
                } else if (anyCurve.start && anyCurve.stop) { // VF.TextBracket (Octave Shift)
                    startNote = anyCurve.start;
                    endNote = anyCurve.stop;
                } else if (anyCurve.notes && anyCurve.notes.length > 0) { // VF.Beam
                    startNote = anyCurve.notes[0];
                    endNote = anyCurve.notes[anyCurve.notes.length - 1];
                }

                if (startNote && endNote) {
                    // Get X range (Absolute X from TickContext)
                    const x1 = startNote.getAbsoluteX();
                    const x2 = endNote.getAbsoluteX();

                    if (isNaN(x1) || isNaN(x2)) return;

                    // Determine Position & Height
                    let isBelow = false;
                    let height = 15; // Default Generic Margin

                    if (curve instanceof VF.StaveHairpin) {
                        isBelow = true; // Usually below
                        height = 20;
                    }
                    else if (curve instanceof VF.TextBracket) {
                        if ((curve as any).position === VF.TextBracket.Position.BOTTOM) isBelow = true;
                        height = 20;
                    }
                    else if (curve instanceof VF.Curve) {
                        if ((curve.render_options as any)?.invert === true) isBelow = true;
                        height = 15;
                    }
                    else if (curve instanceof VF.StaveTie) {
                        return; // Skip ties (minimal vertical impact)
                    }
                    else if (anyCurve.notes) { // VF.Beam
                        // Estimate position based on stem direction of notes?
                        // Or just look at the notes Y?
                        // Simple heuristic: If stems UP, beam is Above. If stems DOWN, beam is Below.
                        // Check first note's stem.
                        try {
                            if (startNote.getStemDirection() === VF.Stem.DOWN) isBelow = true;
                        } catch (e) { }
                        height = 15; // Beam thickness + stem margin
                    }

                    const startIdx = Math.max(0, Math.floor(x1 / resolution));
                    const endIdx = Math.min(numSamples - 1, Math.floor(x2 / resolution));

                    for (let k = startIdx; k <= endIdx; k++) {
                        if (isBelow) {
                            bottomLine[k] += height;
                        } else {
                            skyline[k] -= height;
                        }
                    }
                }
            } catch (e) { }
        };

        if (curves && curves.length > 0) {
            curves.forEach(updateForCurve);
        }

        // 2. Beams 
        // Beams are separate elements, but typically attached to stems.
        // If we strictly follow Stems (which we do), we cover most beam cases.
        // Cross-staff beams are drawn later and are complex to bound here.

        return { skyline, bottomLine };
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