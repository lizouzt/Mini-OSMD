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

    private systemLayouts: { y: number, height: number, systemIndex: number }[] = [];
    private lastDrawData: any = null;
    private lastOptions: any = {};
    private totalHeight: number = 0;

    public clear(): void {
        this.ctx.clear();
    }

    public draw(data: { systems: any[][], curves: any[], systemStaffCurves?: Map<number, Map<number, any[]>>, partGroups?: any[], metadata?: { title: string | undefined, composer: string | undefined } }, options: { darkMode?: boolean, zoom?: number } = {}): Map<number, { topY: number, botY: number }> {
        // 1. Prepare Layout (Calculate Y positions)
        this.prepareLayout(data, options);

        // 2. Render All (default behavior)
        return this.render(null); // null viewport = render all
    }

    public prepareLayout(data: any, options: any): void {
        this.lastDrawData = data;
        this.lastOptions = options;
        this.systemLayouts = [];

        const { systems, systemStaffCurves, metadata } = data;
        let y = 50; // Initial Top Margin

        // Title Height
        if (metadata && (metadata.title || metadata.composer)) {
            y += (metadata.title ? 40 : 0) + (metadata.composer ? 20 : 0) + 20;
        }

        // Loop Systems to Calculate Y AND Assign Staves
        for (let sysIdx = 0; sysIdx < systems.length; sysIdx++) {
            const system = systems[sysIdx];
            const currentSysCurves = systemStaffCurves?.get(sysIdx);

            // 1. Calculate Vertical Layout for this System
            const staffYOffsets = this.calculateSystemLayout(system, currentSysCurves);

            // 2. Iterate Measures to Create Staves and Assign Notes
            let x = 10;
            let currentStartX = 10;
            // Check first measure for margins
            if (system.length > 0) {
                const firstM = system[0];
                if (firstM.staves[0].pageLayout?.margins?.left !== undefined) {
                    currentStartX = firstM.staves[0].pageLayout.margins.left;
                }
            }
            x = currentStartX;

            for (const measureData of system) {
                const measureTopY = y;
                const vfStaves: any[] = []; // Local array for alignment

                // Create Staves for this measure
                for (let staffIndex = 0; staffIndex < measureData.staves.length; staffIndex++) {
                    const staffData = measureData.staves[staffIndex];
                    if (staffYOffsets.length > staffIndex) {
                        const staveY = measureTopY + staffYOffsets[staffIndex];

                        // Create VexFlow Stave
                        const vfStave = new VF.Stave(x, staveY, measureData.width);

                        // Add Modifiers
                        if (staffData.clef || x === currentStartX) vfStave.addClef(staffData.clef || "treble");
                        if (staffData.keySignature) vfStave.addKeySignature(staffData.keySignature);
                        if (staffData.timeSignature) vfStave.addTimeSignature(staffData.timeSignature);

                        const endBarType = measureData.endBarLineType !== undefined ? measureData.endBarLineType : VF.Barline.type.SINGLE;
                        vfStave.setEndBarType(endBarType);

                        if (staffData.voltaType !== undefined && staffData.voltaType !== VF.Volta.type.NONE) {
                            vfStave.setVoltaType(staffData.voltaType, staffData.voltaNumber || "1", 0);
                        }

                        (staffData as any).vfStaveInstance = vfStave; // Cache it
                        vfStaves.push(vfStave);

                        // CREATE VOICES & ASSIGN STAVE
                        const voiceIds = Object.keys(staffData.vfVoices || {});
                        if (voiceIds.length > 0) {
                            const res = this.createVoices(staffData, measureData.maxTicks);
                            (staffData as any).tempVoices = res.voices;
                            (staffData as any).tempAllNotes = res.allNotes;

                            // Assign Stave to Notes (Critical for Cursor)
                            if (res.allNotes) {
                                res.allNotes.forEach((note: any) => {
                                    if (note.setStave) note.setStave(vfStave);
                                    // Apply Styles needed for Formatting (Stem Direction etc)
                                    // if (note.setStyle) note.setStyle(style); // Accessing style requires options.
                                });
                            }
                        }
                    }
                }

                // ALIGNMENT & FORMATTING (Calculate X positions)
                let maxNoteStartX = 0;
                vfStaves.forEach(stave => {
                    stave.format(); // formatting adds StartX
                    if (stave.getNoteStartX() > maxNoteStartX) maxNoteStartX = stave.getNoteStartX();
                });
                vfStaves.forEach(stave => stave.setNoteStartX(maxNoteStartX));

                // Formatting Logic
                const allVoicesInMeasure: any[] = [];
                measureData.staves.forEach((sd: any) => { if (sd.tempVoices) allVoicesInMeasure.push(...sd.tempVoices); });

                let globalFormatSuccess = false;
                if (allVoicesInMeasure.length > 0) {
                    try {
                        const availWidth = Math.max(50, measureData.width - (maxNoteStartX - x) - 10);
                        new VF.Formatter().joinVoices(allVoicesInMeasure).format(allVoicesInMeasure, availWidth);
                        globalFormatSuccess = true;
                    } catch (e) { }
                }

                // Fallback Formatting
                if (!globalFormatSuccess) {
                    measureData.staves.forEach((sd: any, index: number) => {
                        const voices = sd.tempVoices;
                        const stave = vfStaves[index];
                        if (voices) {
                            const nsx = stave.getNoteStartX();
                            const avail = Math.max(50, measureData.width - (nsx - stave.getX()) - 10);
                            try { new VF.Formatter().joinVoices(voices).format(voices, avail); } catch (e) { new VF.Formatter().format(voices, avail); }
                        }
                    });
                }

                // Apply Stem Directions
                measureData.staves.forEach((sd: any) => {
                    if (sd.tempVoices) {
                        sd.tempVoices.forEach((v: any) => {
                            v.getTickables().forEach((t: any) => {
                                if (t.sourceNote && t.sourceNote.stemDirectionXml) {
                                    if (t.sourceNote.stemDirectionXml === "up") t.setStemDirection(VF.Stem.UP);
                                    else if (t.sourceNote.stemDirectionXml === "down") t.setStemDirection(VF.Stem.DOWN);
                                }
                            });
                        });
                    }
                });

                x += measureData.width;
            }

            // 3. Determine System Height
            const lastStaffIdx = staffYOffsets.length - 1;
            const systemHeightEstimate = staffYOffsets[lastStaffIdx] + 120;

            // Handle Page Break Gap in Y
            const firstMeasure = system[0];
            if (firstMeasure) {
                const firstStaff = firstMeasure.staves[0];
                if (sysIdx > 0 && firstStaff.printNewPage) {
                    y += 80;
                }
            }

            // Store Layout
            this.systemLayouts.push({
                y: y,
                height: systemHeightEstimate,
                systemIndex: sysIdx
            });

            // Advance Y
            y += systemHeightEstimate;
        }

        this.totalHeight = y;
    }

    public render(viewport: { top: number, height: number } | null): Map<number, { topY: number, botY: number }> {
        const data = this.lastDrawData;
        const options = this.lastOptions;
        if (!data) return new Map();

        const { systems, curves, systemStaffCurves, partGroups, metadata } = data;
        const { darkMode, zoom = 1.0 } = options;

        this.ctx.clear();

        // Style
        const color = darkMode ? "#FFFFFF" : "#000000";
        const style = { fillStyle: color, strokeStyle: color };
        this.ctx.setFillStyle(color);
        this.ctx.setStrokeStyle(color);
        this.renderer.ctx.element.style.filter = "none";
        this.renderer.ctx.element.style.display = "block";

        // Resize SVG container to total height immediately
        const visualWidth = this.container.clientWidth;
        const logicalHeight = this.totalHeight + 50;
        const visualHeight = logicalHeight * zoom;

        if (this.renderer.resize) {
            this.renderer.resize(visualWidth, visualHeight);
            const logicalWidth = visualWidth / zoom;
            this.ctx.svg.setAttribute("viewBox", `0 0 ${logicalWidth} ${logicalHeight}`);
        }

        // Draw Title (Always if top of sheet is visible OR just draw it)
        // Simply check if 0 is in viewport?
        if (!viewport || viewport.top < 200) { // Approx title height
            this.drawTitleAndComposer(metadata, 50, color);
        }

        const measureBounds = new Map<number, { topY: number, botY: number }>();
        const startX = 10;

        // Render Visible Systems
        let visibleCount = 0;
        for (const layout of this.systemLayouts) {
            // Visibility Check
            if (viewport) {
                const sysTop = layout.y * zoom; // Zoom visual check?
                const sysBot = (layout.y + layout.height + 60) * zoom; // Include gap
                const viewTop = viewport.top;
                const viewBot = viewport.top + viewport.height;

                // Intersection check
                if (sysBot < viewTop || sysTop > viewBot) {
                    continue; // Skip rendering
                }
            }
            visibleCount++;

            const sysIdx = layout.systemIndex;
            const system = systems[sysIdx];
            const currentSysCurves = systemStaffCurves?.get(sysIdx);

            // Re-calc layout? Or use cached?
            // calculateSystemLayout depends on curves and context. Fast enough to re-run?
            // Yes, "Layout Phase 1" was dry run. Now real run.
            // Ideally we cache offsets. But simpler to re-calc than store massive arrays.
            // Optim: Cache offsets in systemLayouts object?
            // Let's re-calc for robustness first MVP.
            const staffYOffsets = this.calculateSystemLayout(system, currentSysCurves);

            let y = layout.y; // Use pre-calculated Y
            let x = startX;

            // System Drawing Logic (Copied from original draw)
            let maxSystemBottom = 0;
            let systemDist = 80;
            const firstMeasure = system[0];
            let currentStartX = startX;

            // Page Break Visuals (Check again to draw line)
            if (firstMeasure) {
                const firstStaff = firstMeasure.staves[0];
                if (sysIdx > 0 && firstStaff.printNewPage) {
                    // y was incremented in prepareLayout. Use that.
                    // But we need to draw the line relative to y.
                    // In prepareLayout: if PageBreak, y+=80.
                    // Here y is the StartY of the system. So the gap is ABOVE y.

                    this.ctx.save();
                    this.ctx.setStrokeStyle("#dddddd");
                    this.ctx.setLineWidth(2);
                    this.ctx.beginPath();
                    this.ctx.moveTo(20, y - 40); // 40px above start
                    this.ctx.lineTo(this.container.clientWidth - 20, y - 40);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
                if (firstStaff.pageLayout && firstStaff.pageLayout.margins) {
                    if (firstStaff.pageLayout.margins.left !== undefined) currentStartX = firstStaff.pageLayout.margins.left;
                }
                if (firstMeasure.systemDistance !== undefined) systemDist = firstMeasure.systemDistance;
            }

            x = currentStartX;

            // Draw Measures in System
            for (const measureData of system) {
                if (this.ctx.openGroup) {
                    this.ctx.openGroup("measure", `measure-${measureData.measureNumber}`);
                }

                const staves = measureData.staves;
                // Prepare VexFlow Staves
                const vfStaves: any[] = [];
                let measureTopY = Number.MAX_VALUE;
                let measureBotY = Number.MIN_VALUE;

                // 1. Draw Staves
                staves.forEach((staffData: any) => {
                    const vfStave = (staffData as any).vfStaveInstance;
                    if (vfStave) {
                        this.ctx.setFillStyle(color);
                        this.ctx.setStrokeStyle(color);
                        vfStave.setContext(this.ctx).draw();
                        vfStaves.push(vfStave);

                        if (vfStave.getY() < measureTopY) measureTopY = vfStave.getY();
                        if (vfStave.getBottomY() > measureBotY) measureBotY = vfStave.getBottomY();
                    }
                });

                // 2. Draw Voices (using cached voices from prepareLayout)
                staves.forEach((staffData: any, index: number) => {
                    const vfStave = vfStaves[index];
                    const voices = (staffData as any).tempVoices;
                    const allNotes = (staffData as any).tempAllNotes;

                    if (voices && vfStave) {
                        // Re-Apply Style (needed for DarkMode toggle)
                        if (allNotes) {
                            allNotes.forEach((n: any) => {
                                if (n.setStyle) n.setStyle(style);
                                if (n.setStemStyle) n.setStemStyle(style);
                                if (n.setLedgerLineStyle) n.setLedgerLineStyle(style);
                            });
                        }

                        voices.forEach((v: any) => v.draw(this.ctx, vfStave));

                        if (staffData.vfTuplets) {
                            staffData.vfTuplets.forEach((t: any) => {
                                this.ctx.setFillStyle(color);
                                this.ctx.setStrokeStyle(color);
                                try { t.setContext(this.ctx).draw(); } catch (e) { }
                            });
                        }
                    }
                });

                // 3. Beams
                if (measureData.beams) {
                    measureData.beams.forEach((beam: any) => {
                        if (beam.setStyle) beam.setStyle(style);
                        this.ctx.setFillStyle(color);
                        this.ctx.setStrokeStyle(color);
                        try { beam.setContext(this.ctx).draw(); } catch (e) { }
                    });
                }

                // 4. Connectors
                // Check if this is the first measure (x === startX)
                // Use vfStave.getX() to be precise
                if (vfStaves.length > 0 && Math.abs(vfStaves[0].getX() - currentStartX) < 1) {
                    if (partGroups) {
                        partGroups.forEach(group => {
                            const startIdx = group.startStaffId - 1;
                            const endIdx = group.endStaffId - 1;
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
                    if (vfStaves.length > 1) {
                        const lineConnector = new VF.StaveConnector(vfStaves[0], vfStaves[vfStaves.length - 1]);
                        lineConnector.setType(VF.StaveConnector.type.SINGLE_LEFT);
                        this.ctx.setFillStyle(color);
                        this.ctx.setStrokeStyle(color);
                        lineConnector.setContext(this.ctx).draw();
                    }
                }

                // Right Connector
                const isLastMeasure = system.indexOf(measureData) === system.length - 1;
                if (isLastMeasure && vfStaves.length > 1) {
                    const topStave = vfStaves[0];
                    const botStave = vfStaves[vfStaves.length - 1];
                    const lineX = topStave.getX() + topStave.getWidth();
                    this.ctx.beginPath();
                    this.ctx.setStrokeStyle(color);
                    this.ctx.setLineWidth(1.5);
                    this.ctx.moveTo(lineX, topStave.getYForLine(0));
                    this.ctx.lineTo(lineX, botStave.getYForLine(botStave.getNumLines() - 1));
                    this.ctx.stroke();
                }

                measureBounds.set(measureData.measureIndex, { topY: measureTopY, botY: measureBotY });

                if (this.ctx.closeGroup) this.ctx.closeGroup();
                x += measureData.width;
            } // End Measure Loop
        } // End System Loop

        // Curves (Global) - Filter by Viewport?
        // Curves are tricky because they span systems.
        // For MVP: Draw ALL curves? Or try to filter?
        // Check curve.from/to Y bounding box.
        // If we draw all, performance impact is low (few curves compared to notes).
        // Let's draw all for now to avoid complexity of bounding box calculation for curves.
        if (curves) {
            this.ctx.setStrokeStyle(color);
            this.ctx.setFillStyle(color);
            curves.forEach(curve => {
                try {
                    curve.setContext(this.ctx).draw();
                } catch (e) { }
            });
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

            // Check for explicit staff distance (from first measure of system)
            // Note: Currently we don't pass system-level config easily to this function unless we look at measures.
            // Let's check the first measure for staff-distance
            const firstMeasure = system[0];
            if (firstMeasure && firstMeasure.staffDistance !== undefined) {
                // Use XML staff-distance (converted approx 1/10th of unit? No, XML is usually tenths. VexFlow is pixels.)
                // Mini-OSMD assumes 10px = 1 half-space? 
                // Standard: 10px ~ 10 tenths? No. 
                // Let's assume input is purely purely proportional for now or use raw value if reasonable.
                // In MusicXML, default spacing is around 65-80.
                // If we receive "65", that's 65 tenths = 6.5 spaces. 
                // VexFlow Stave space is 10px. 
                // So 6.5 spaces * 10 = 65px. 
                // So we can use the value almost directly if we assume tenths.
                maxOverlap = Math.max(maxOverlap, firstMeasure.staffDistance);
            }

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
                    else if ((anyCurve as any).render_options) {
                        if ((anyCurve as any).render_options.invert) isBelow = true;
                        // Fix for property access
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

    /**
     * Get the measure index at the given coordinates (relative to container).
     * Uses the calculated System Layout.
     */
    public getMeasureAt(x: number, y: number, zoom: number): number | undefined {
        const adjustedY = y / zoom;
        const adjustedX = x / zoom;

        // Find System
        // Binary search or linear scan (linear is fine for < 1000 systems)
        let foundSystem: any = null;
        let foundSysLayout: any = null;

        for (const layout of this.systemLayouts) {
            // Check Y (include gaps)
            if (adjustedY >= layout.y && adjustedY <= layout.y + layout.height + 60) {
                foundSystem = this.lastDrawData.systems[layout.systemIndex];
                foundSysLayout = layout;
                break;
            }
        }

        if (!foundSystem) return undefined;

        // Find Measure in System
        // We need X start.
        // Similar logic to draw loop
        // If we don't cache X positions, we re-calculate? 
        // We know measures are sequential in X.

        // Handle Page Margins/Indents from first measure
        let currentX = 10; // Default startX
        const firstMeasure = foundSystem[0];
        if (firstMeasure) {
            const firstStaff = firstMeasure.staves[0];
            if (firstStaff.pageLayout && firstStaff.pageLayout.margins && firstStaff.pageLayout.margins.left !== undefined) {
                currentX = firstStaff.pageLayout.margins.left;
            }
        }

        for (const measureData of foundSystem) {
            if (adjustedX >= currentX && adjustedX <= currentX + measureData.width) {
                return measureData.measureIndex;
            }
            currentX += measureData.width;
        }

        return undefined;
    }

    /**
     * Get bounds for a specific measure index.
     * Useful for Cursor when the measure might not be legally rendered yet, 
     * or we want fast lookup without re-rendering.
     */
    public getMeasureBounds(measureIndex: number): { topY: number, botY: number } | undefined {
        // Find which system contains this measure
        // We can pre-map measureIndex -> systemIndex but simple search is OK.
        // Or optimize: Store measureIndex range in SystemLayout.

        const systems = this.lastDrawData?.systems;
        if (!systems) return undefined;

        for (const layout of this.systemLayouts) {
            const system = systems[layout.systemIndex];
            // Check if measure in system
            // Measures are ordered? Yes.
            if (system.length > 0) {
                const first = system[0].measureIndex;
                const last = system[system.length - 1].measureIndex;
                if (measureIndex >= first && measureIndex <= last) {
                    // Found system.
                    // Y = layout.y
                    // Height = layout.height (Approx)
                    // To be precise, we want Top/Bot Y of the staves.
                    // The layout.height is (offset + 120).
                    // topY = layout.y
                    // botY = layout.y + layout.height.
                    // This is "Good Enough" for cursor? Cursor draws line from top to bot.
                    // If we want exact staff extension, we need calculateSystemLayout offsets.

                    // Let's refine:
                    // We can re-call calculateSystemLayout.
                    // Or just use the System Bounds.

                    return {
                        topY: layout.y,
                        botY: layout.y + layout.height
                    };
                }
            }
        }
        return undefined;
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