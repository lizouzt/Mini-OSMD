import * as VF from "vexflow";
import { MusicSheet } from "../../MusicSheet";
import { GraphicalMusicSheet } from "../GraphicalMusicSheet";
import { Pitch, NoteEnum } from "../../VoiceData/Pitch";
import { ClefEnum } from "../../VoiceData/Instructions/ClefInstruction";
import { BarLineType, EndingType } from "../../VoiceData/SourceMeasure";
import { WedgeType } from "../../VoiceData/Wedge";
import { OctaveShiftType } from "../../VoiceData/OctaveShift";
import { Note, ArticulationEnum } from "../../VoiceData/Note";
import { Tuplet } from "../../VoiceData/Tuplet";

export class VexFlowMusicSheetCalculator {
    private static getKeySignature(fifths: number): string {
        switch (fifths) {
            case 0: return "C";
            case 1: return "G";
            case 2: return "D";
            case 3: return "A";
            case 4: return "E";
            case 5: return "B";
            case 6: return "F#";
            case 7: return "C#";
            case -1: return "F";
            case -2: return "Bb";
            case -3: return "Eb";
            case -4: return "Ab";
            case -5: return "Db";
            case -6: return "Gb";
            case -7: return "Cb";
            default: return "C";
        }
    }

    public static format(graphicalSheet: GraphicalMusicSheet, sheet: MusicSheet, containerWidth: number = 1000): { systems: any[][], curves: any[], noteMap: Map<any, any>, partGroups: any[], metadata: { title: string | undefined, composer: string | undefined }, systemStaffCurves: Map<number, Map<number, any[]>> } {
        const systems: any[][] = [];
        let currentSystem: any[] = [];
        let currentSystemWidth = 0;
        const noteMap = new Map<any, any>();

        // Track current state across measures for EACH staff
        // Index 0 = Staff 1
        const currentClefStrs: string[] = ["treble", "bass"];
        const currentTimeStrs: string[] = ["4/4", "4/4"];
        const currentKeyStrs: string[] = ["C", "C"]; // Track Key

        let activeVolta = false;

        // Map Staff Index to Instrument Name (for first system labels)
        const staffInstrumentLabels: { [staffIdx: number]: string } = {};
        let currentStaffIdx = 0;
        sheet.instruments.forEach(inst => {
            // Label usually on the first staff of the instrument
            if (inst.name) {
                staffInstrumentLabels[currentStaffIdx] = inst.name;
            }
            currentStaffIdx += inst.numStaves;
        });

        const preparedMeasures: any[] = [];

        // --- PASS 1: Build VexFlow Objects & Calculate Min Widths ---
        for (const measure of sheet.sourceMeasures) {
            // Volta Logic
            let voltaType = VF.Volta.type.NONE;
            if (measure.endingType === EndingType.Start) {
                voltaType = VF.Volta.type.BEGIN;
                activeVolta = true;
            } else if (measure.endingType === EndingType.Stop) {
                voltaType = VF.Volta.type.END;
                activeVolta = false;
            } else if (measure.endingType === EndingType.StartStop) {
                voltaType = VF.Volta.type.BEGIN_END;
                activeVolta = false;
            } else if (activeVolta) {
                voltaType = VF.Volta.type.MID;
            }

            // Update state for each staff
            measure.clefs.forEach((clef, index) => {
                if (clef) {
                    switch (clef.clefType) {
                        case ClefEnum.G: currentClefStrs[index] = "treble"; break;
                        case ClefEnum.F: currentClefStrs[index] = "bass"; break;
                        case ClefEnum.C: currentClefStrs[index] = "alto"; break;
                        default: currentClefStrs[index] = "treble";
                    }
                }
            });
            measure.rhythms.forEach((rhythm, index) => {
                if (rhythm) {
                    currentTimeStrs[index] = `${rhythm.numerator}/${rhythm.denominator}`;
                }
            });
            measure.keys.forEach((key, index) => {
                if (key) {
                    currentKeyStrs[index] = VexFlowMusicSheetCalculator.getKeySignature(key.key);
                }
            });

            // Group notes by Staff ID, then Voice ID
            // staffVoices[staffIndex][voiceId] = notes
            const staffVoices: { [staffIdx: number]: { [voiceId: string]: any[] } } = {};
            const staffTuplets: { [staffIdx: number]: any[] } = {};

            // Initialize containers for known staves (at least 1, or dynamic based on notes)
            // Determine max staff index from notes
            let maxStaffIndex = 0;
            measure.notes.forEach(n => maxStaffIndex = Math.max(maxStaffIndex, n.staffId - 1));
            // Also check attributes
            maxStaffIndex = Math.max(maxStaffIndex, measure.clefs.length - 1);

            for (let s = 0; s <= maxStaffIndex; s++) {
                staffVoices[s] = {};
                staffTuplets[s] = [];
            }

            // Helper to group notes (Reuse logic per staff)
            // We need to iterate notes and push to correct staffVoices

            const staffVoiceNotes: { [staffIdx: number]: { [voiceId: string]: { [timestamp: number]: Note[] } } } = {};
            const staffVoiceTimestamps: { [staffIdx: number]: { [voiceId: string]: number[] } } = {};

            for (const note of measure.notes) {
                const sIdx = note.staffId - 1;
                const vid = note.voiceId;
                const ts = note.timestamp.RealValue;

                if (!staffVoiceNotes[sIdx]) {
                    staffVoiceNotes[sIdx] = {};
                    staffVoiceTimestamps[sIdx] = {};
                }
                if (!staffVoiceNotes[sIdx][vid]) {
                    staffVoiceNotes[sIdx][vid] = {};
                    staffVoiceTimestamps[sIdx][vid] = [];
                }
                if (!staffVoiceNotes[sIdx][vid][ts]) {
                    staffVoiceNotes[sIdx][vid][ts] = [];
                    staffVoiceTimestamps[sIdx][vid].push(ts);
                }
                staffVoiceNotes[sIdx][vid][ts].push(note);
            }

            // Process each staff
            for (let s = 0; s <= maxStaffIndex; s++) {
                if (!staffVoiceNotes[s]) continue; // No notes for this staff

                for (const vid in staffVoiceNotes[s]) {
                    staffVoices[s][vid] = [];
                    staffVoiceTimestamps[s][vid].sort((a, b) => a - b);

                    let graceNotesQueue: Note[] = [];

                    for (const ts of staffVoiceTimestamps[s][vid]) {
                        const notes = staffVoiceNotes[s][vid][ts];
                        if (notes.length === 0) continue;

                        // Separate Grace Notes
                        const mainNotes = notes.filter(n => !n.isGrace);
                        const graceNotes = notes.filter(n => n.isGrace);

                        if (mainNotes.length === 0) {
                            graceNotesQueue.push(...graceNotes);
                            continue;
                        }

                        const mainNote = mainNotes[0];
                        const keys: string[] = [];

                        if (mainNote.isRest) {
                            keys.push("b/4");
                        } else {
                            const instrument = sheet.getInstrumentForStaff(s + 1);
                            const transpose = sheet.Transpose + (instrument ? instrument.Transpose : 0);

                            for (const n of mainNotes) {
                                let pitch = n.pitch;
                                if (transpose !== 0) {
                                    pitch = Pitch.transpose(n.pitch, transpose);
                                }
                                const stepName = NoteEnum[pitch.step].toLowerCase();
                                keys.push(`${stepName}/${pitch.octave}`);
                            }

                        }

                        // Map XML type to VexFlow duration
                        let duration = "q";
                        switch (mainNote.durationType) {
                            case "whole": duration = "w"; break;
                            case "half": duration = "h"; break;
                            case "quarter": duration = "q"; break;
                            case "eighth": duration = "8"; break;
                            case "16th": duration = "16"; break;
                            default: duration = "q";
                        }

                        if (mainNote.isRest) {
                            duration += "r";
                        }

                        let vfNote: VF.StaveNote;

                        // Handle Invisible Notes (print-object="no") -> GhostNote
                        if (!mainNote.printObject) {
                            vfNote = new VF.GhostNote({
                                duration: duration
                            }) as any;
                        } else {
                            vfNote = new VF.StaveNote({
                                clef: currentClefStrs[s] || "treble",
                                keys: keys,
                                duration: duration,
                            });
                        }

                        // Apply Stem Direction from XML
                        if (mainNote.stemDirectionXml) {
                            if (mainNote.stemDirectionXml === "up") vfNote.setStemDirection(VF.Stem.UP);
                            else if (mainNote.stemDirectionXml === "down") vfNote.setStemDirection(VF.Stem.DOWN);
                        }

                        // Fix Ticks for Tuplets/unusual durations
                        try {
                            const resolution = 16384;
                            const num = mainNote.length.numerator * resolution;
                            const den = mainNote.length.denominator;
                            const tickFrac = new VF.Fraction(num, den);

                            // Try setTicks method first
                            if (typeof (vfNote as any).setTicks === "function") {
                                (vfNote as any).setTicks(tickFrac);
                            } else {
                                (vfNote as any).ticks = tickFrac;
                            }
                        } catch (e) {
                            console.warn("Error setting ticks:", e);
                        }

                        // Attach source note for cursor mapping
                        (vfNote as any).sourceNote = mainNote;

                        // Add Accidentals
                        mainNotes.forEach((n, index) => {
                            let acc = "";
                            if (n.accidentalXml) {
                                switch (n.accidentalXml) {
                                    case "natural": acc = "n"; break;
                                    case "sharp": acc = "#"; break;
                                    case "flat": acc = "b"; break;
                                    case "double-sharp": acc = "##"; break;
                                    case "flat-flat": acc = "bb"; break;
                                    case "quarter-flat": acc = "d"; break;
                                    case "quarter-sharp": acc = "+"; break;
                                    default: break;
                                }
                            } else if (n.pitch.alter !== 0) {
                                if (n.pitch.alter === 1) acc = "#";
                                else if (n.pitch.alter === -1) acc = "b";
                                else if (n.pitch.alter === 2) acc = "##";
                                else if (n.pitch.alter === -2) acc = "bb";
                            }

                            if (acc) vfNote.addModifier(new VF.Accidental(acc), index);

                            // Add Articulations
                            n.articulations.forEach(art => {
                                let vfArt = "";
                                switch (art) {
                                    case ArticulationEnum.STACCATO: vfArt = "a."; break;
                                    case ArticulationEnum.STACCATISSIMO: vfArt = "av"; break;
                                    case ArticulationEnum.ACCENT: vfArt = "a>"; break;
                                    case ArticulationEnum.STRONG_ACCENT: vfArt = "a^"; break;
                                    case ArticulationEnum.TENUTO: vfArt = "a-"; break;
                                    case ArticulationEnum.FERMATA: vfArt = "a@a"; break;
                                }

                                if (vfArt) {
                                    const modifier = new VF.Articulation(vfArt);
                                    vfNote.addModifier(modifier, index);
                                }
                            });

                            // Add Dynamics
                            if (n.dynamics && n.dynamics.length > 0) {
                                n.dynamics.forEach(dyn => {
                                    const annotation = new VF.Annotation(dyn)
                                        .setFont("Times", 12, "italic")
                                        .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
                                    vfNote.addModifier(annotation, index);
                                });
                            }

                            // Add Word (Directions)
                            if (n.words && n.words.length > 0) {
                                n.words.forEach(w => {
                                    const annotation = new VF.Annotation(w)
                                        .setFont("Times", 11, "bold")
                                        .setVerticalJustification(VF.Annotation.VerticalJustify.TOP);
                                    vfNote.addModifier(annotation, index);
                                });
                            }

                            // Add Chord Symbols (Phase 4)
                            // Only add to the first staff (s === 0) and only if timestamp matches
                            if (s === 0 && measure.chordSymbols && measure.chordSymbols.length > 0) {
                                const noteTimestamp = n.timestamp ? n.timestamp.RealValue : -1;
                                if (noteTimestamp >= 0) {
                                    const chords = measure.chordSymbols.filter((c: any) => Math.abs(c.timestamp.RealValue - noteTimestamp) < 0.001);
                                    chords.forEach((c: any) => {
                                        // Construct Chord String (Simplified)
                                        // Root
                                        let text = NoteEnum[c.root.step].replace("None", "");
                                        // Alter
                                        if (c.root.alter === 1) text += "#";
                                        else if (c.root.alter === -1) text += "b";

                                        // Kind
                                        if (c.kind) {
                                            if (c.kind === "major") text += "M";
                                            else if (c.kind === "minor") text += "m";
                                            else if (c.kind === "seventh") text += "7";
                                            else if (c.kind === "major-seventh") text += "M7";
                                            else if (c.kind === "minor-seventh") text += "m7";
                                            else if (c.kind === "dominant") text += "7";
                                            else text += c.kind; // Fallback
                                        }

                                        // Bass
                                        if (c.bass) {
                                            text += "/" + NoteEnum[c.bass.step];
                                            if (c.bass.alter === 1) text += "#";
                                            else if (c.bass.alter === -1) text += "b";
                                        }

                                        // Use VF.Annotation for stability
                                        // VF.ChordSymbol is complex to setup without VexFlow patch
                                        const cs = new VF.Annotation(text)
                                            .setFont("Arial", 12, "bold") // Jazz-like font
                                            .setVerticalJustification(VF.Annotation.VerticalJustify.TOP);
                                        vfNote.addModifier(cs, index);
                                    });
                                }
                            }
                        });

                        // Add Lyrics
                        if (mainNote.lyrics && mainNote.lyrics.length > 0) {
                            mainNote.lyrics.forEach(lyric => {
                                if (lyric.text) {
                                    const text = lyric.text + (lyric.syllabic === "begin" || lyric.syllabic === "middle" ? "-" : "");
                                    const annotation = new VF.Annotation(text)
                                        .setFont("Serif", 10)
                                        .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
                                    vfNote.addModifier(annotation, 0);
                                }
                            });
                        }

                        // Add Words (Text Expressions like "Allegro", "dolce")
                        if (mainNote.words && mainNote.words.length > 0) {
                            mainNote.words.forEach(word => {
                                const annotation = new VF.Annotation(word)
                                    .setFont("Times", 11, "italic") // Basic styling
                                    .setVerticalJustification(VF.Annotation.VerticalJustify.TOP); // Default to top? XML says placement...
                                // XML placement is properly better, but for now defaulting TOP for directions is safe-ish.
                                // Or check XML attributes if we stored them (we didn't store placement in string).
                                vfNote.addModifier(annotation, 0);
                            });
                        }

                        // Handle Grace Notes
                        const combinedGraceNotes = [...graceNotesQueue, ...graceNotes];
                        if (combinedGraceNotes.length > 0) {
                            const vfGraceNotes = combinedGraceNotes.map(gn => {
                                const gnStep = NoteEnum[gn.pitch.step].toLowerCase();
                                const gvfNote = new VF.GraceNote({
                                    keys: [`${gnStep}/${gn.pitch.octave}`],
                                    duration: "8", // Can map durationType if needed, but 8 is standard for visual grace
                                    slash: gn.graceSlash
                                });
                                if (gn.pitch.alter !== 0) {
                                    let acc = "";
                                    if (gn.pitch.alter === 1) acc = "#";
                                    else if (gn.pitch.alter === -1) acc = "b";
                                    if (acc) gvfNote.addModifier(new VF.Accidental(acc), 0);
                                }
                                return gvfNote;
                            });
                            const graceNoteGroup = new VF.GraceNoteGroup(vfGraceNotes);
                            vfNote.addModifier(graceNoteGroup, 0);
                            graceNotesQueue = [];
                        }

                        // Stem Direction
                        if (vid === "1") vfNote.setStemDirection(VF.Stem.UP);
                        else vfNote.setStemDirection(VF.Stem.DOWN);

                        staffVoices[s][vid].push(vfNote);
                        (vfNote as any).sourceNotes = notes; // Attach for Beaming Logic

                        for (const n of notes) {
                            noteMap.set(n, vfNote);
                        }
                    }
                }

                // Tuplets for this staff
                const processedTuplets = new Set<Tuplet>();
                for (const note of measure.notes) {
                    if (note.staffId - 1 === s && note.tuplet && !processedTuplets.has(note.tuplet)) {
                        const logicalTuplet = note.tuplet;
                        const tupletVfNotes = logicalTuplet.notes
                            .map(n => noteMap.get(n))
                            .filter((v, i, a) => v && a.indexOf(v) === i);

                        if (tupletVfNotes.length > 0) {
                            const vfTuplet = new VF.Tuplet(tupletVfNotes, {
                                numNotes: logicalTuplet.actualNotes,
                                notesOccupied: logicalTuplet.normalNotes
                            });

                            // Validated bracket usage
                            const bracketed = logicalTuplet.bracket !== false; // Default true
                            vfTuplet.setBracketed(bracketed);
                            // vfTuplet.setShowNumber(logicalTuplet.showNumber); // Not supported in this VF version

                            if (logicalTuplet.placement === "above") {
                                vfTuplet.setTupletLocation(VF.Tuplet.LOCATION_TOP);
                            } else if (logicalTuplet.placement === "below") {
                                vfTuplet.setTupletLocation(VF.Tuplet.LOCATION_BOTTOM);
                            }
                            staffTuplets[s].push(vfTuplet);
                        }
                        processedTuplets.add(logicalTuplet);
                    }
                }
            }

            // Calculate Width (Max of all staves)
            let minWidth = 80; // Lower floor for sparse measures

            // 0. Pre-calculate Global Max Ticks for the ENTIRE measure (all staves)
            // This ensures strict alignment across all staves (e.g. Piano Grand Staff)
            let measureMaxTicks = 0;
            for (let s = 0; s <= maxStaffIndex; s++) {
                for (const vid in staffVoices[s]) {
                    let ticks = 0;
                    staffVoices[s][vid].forEach((note: any) => {
                        const noteTicks = note.ticks ? note.ticks.value() : 0;
                        ticks += noteTicks;
                    });
                    if (ticks > measureMaxTicks) measureMaxTicks = ticks;
                }
            }

            // Iterate all staves to find max required width
            const allMeasureVoices: VF.Voice[] = [];

            for (let s = 0; s <= maxStaffIndex; s++) {
                const tempVoices: any[] = [];


                // 1. Create Voices with Normalized Duration (Global Measure Max Ticks)
                for (const vid in staffVoices[s]) {
                    // Default to Time Signature if empty or zero (should-n't happen often)
                    let numBeats = 4;
                    let beatValue = 4;

                    if (measureMaxTicks > 0) {
                        // Using Constant 16384 for Resolution (Whole Note)
                        // Ticks per beat (Quarter) = 16384 / 4 = 4096.
                        numBeats = measureMaxTicks / 4096;
                    } else if (currentTimeStrs[s]) {
                        const parts = currentTimeStrs[s].split("/");
                        numBeats = parseInt(parts[0]);
                        beatValue = parseInt(parts[1]);
                    }

                    // PADDING STRATEGY:
                    // Ensure voice is fully filled to measureMaxTicks to satisfy joinVoices()
                    let currentTicks = 0;
                    staffVoices[s][vid].forEach((note: any) => {
                        const t = note.ticks ? note.ticks.value() : 0;
                        currentTicks += t;
                    });

                    if (measureMaxTicks > 0 && currentTicks < measureMaxTicks) {
                        const diff = measureMaxTicks - currentTicks;
                        const ghost = new VF.GhostNote({ duration: "b" });
                        if ((ghost as any).setTicks) {
                            (ghost as any).setTicks(new VF.Fraction(diff, 1));
                        } else {
                            (ghost as any).ticks = new VF.Fraction(diff, 1);
                        }
                        staffVoices[s][vid].push(ghost);
                    }

                    const voice = new VF.Voice({ numBeats: numBeats, beatValue: beatValue });
                    voice.setStrict(false);
                    voice.addTickables(staffVoices[s][vid]);
                    tempVoices.push(voice);
                }

                if (tempVoices.length > 0) {
                    allMeasureVoices.push(...tempVoices);
                }
            }

            if (allMeasureVoices.length > 0) {
                try {
                    const formatter = new VF.Formatter();
                    // Join ALL voices to calculate correctly aligned width
                    const w = formatter.joinVoices(allMeasureVoices).preCalculateMinTotalWidth(allMeasureVoices);

                    let padding = 40;
                    // Add padding for the "heaviest" staff attributes (approximation)
                    // We check all staves for attributes to ensure enough space
                    let maxPaddingAdd = 0;
                    for (let s = 0; s <= maxStaffIndex; s++) {
                        let p = 0;
                        if (measure.clefs[s] || measure.measureNumber === 1) p += 50;
                        if (measure.rhythms[s] || measure.measureNumber === 1) p += 40;
                        if (measure.keys[s]) p += 30;
                        if (p > maxPaddingAdd) maxPaddingAdd = p;
                    }
                    padding += maxPaddingAdd;

                    // Reduce Multiplier to avoid excessive width
                    minWidth = Math.max(minWidth, (w * 1.2) + padding);
                } catch (e) {
                    console.warn("Formatting error:", e);
                }
            }

            // Build staves data
            const stavesData: any[] = [];
            const measureBeams: any[] = [];
            const staffLyricConnectors: { [staffId: number]: any[] } = {};

            // GLOBAL BEAMING (Cross-Staff)
            const globalVoiceMap: { [vid: string]: any[] } = {};

            for (let s = 0; s <= maxStaffIndex; s++) {
                for (const vid in staffVoices[s]) {
                    if (!globalVoiceMap[vid]) globalVoiceMap[vid] = [];
                    // Filter ghosts
                    const realNotes = staffVoices[s][vid].filter((n: any) => {
                        const isGhost = (n instanceof VF.GhostNote) || (n.getCategory && n.getCategory() === 'ghostnote');
                        return !isGhost;
                    });
                    globalVoiceMap[vid].push(...realNotes);
                }
            }

            // Generate Beams per Global Voice
            for (const vid in globalVoiceMap) {
                const notes = globalVoiceMap[vid];
                // Sort notes by timestamp (ticks)
                notes.sort((a: any, b: any) => {
                    const tA = (a.sourceNotes && a.sourceNotes[0]) ? a.sourceNotes[0].timestamp.RealValue : 0;
                    const tB = (b.sourceNotes && b.sourceNotes[0]) ? b.sourceNotes[0].timestamp.RealValue : 0;
                    return tA - tB;
                });

                // 1. Beams Logic
                let hasXmlBeams = false;
                let currentBeamGroup: any[] = [];
                // ... (Existing Beam Logic) ...
                for (const note of notes) {
                    const source = (note as any).sourceNotes ? (note as any).sourceNotes[0] : null;
                    if (source && source.beams && source.beams.length > 0) {
                        hasXmlBeams = true;
                        const beamType = source.beams[0]; // Primary beam
                        if (beamType === "begin") {
                            if (currentBeamGroup.length > 0) {
                                if (currentBeamGroup.length > 1) measureBeams.push(new VF.Beam(currentBeamGroup));
                                currentBeamGroup = [];
                            }
                            currentBeamGroup.push(note);
                        } else if (beamType === "continue") {
                            currentBeamGroup.push(note);
                        } else if (beamType === "end") {
                            currentBeamGroup.push(note);
                            if (currentBeamGroup.length > 1) measureBeams.push(new VF.Beam(currentBeamGroup));
                            currentBeamGroup = [];
                        } else if (beamType === "forward-hook" || beamType === "backward-hook") {
                            currentBeamGroup.push(note);
                        }
                    } else {
                        // Break beam group if finding note without beam
                        if (currentBeamGroup.length > 0) {
                            if (currentBeamGroup.length > 1) measureBeams.push(new VF.Beam(currentBeamGroup));
                            currentBeamGroup = [];
                        }
                    }
                }
                if (currentBeamGroup.length > 1) {
                    measureBeams.push(new VF.Beam(currentBeamGroup));
                }

                // Fallback: Auto Beam
                if (!hasXmlBeams && notes.length > 1) {
                    try {
                        const beams = VF.Beam.generateBeams(notes);
                        measureBeams.push(...beams);
                    } catch (e) { }
                }

                // 2. Lyric Connectors Logic (Hyphens & Extenders)
                for (let i = 0; i < notes.length - 1; i++) {
                    const note = notes[i];
                    const nextNote = notes[i + 1];
                    const source = (note as any).sourceNotes ? (note as any).sourceNotes[0] : null;

                    if (source && source.lyrics && source.lyrics.length > 0) {
                        // Hyphens
                        const lyric = source.lyrics[0]; // Assume 1st verse for now
                        if (lyric.syllabic === "begin" || lyric.syllabic === "middle") {
                            // Add Hyphen Connector
                            const sId = source.staffId - 1;
                            if (!staffLyricConnectors[sId]) staffLyricConnectors[sId] = [];
                            staffLyricConnectors[sId].push({
                                type: "hyphen",
                                from: note,
                                to: nextNote
                            });
                        }
                        // Extenders (Single line from this note to next)
                        if (lyric.extend === "start" || lyric.extend === "continue" || lyric.extend === true) {
                            const sId = source.staffId - 1;
                            if (!staffLyricConnectors[sId]) staffLyricConnectors[sId] = [];
                            staffLyricConnectors[sId].push({
                                type: "extender",
                                from: note,
                                to: nextNote
                            });
                        }
                    }
                }
            }

            for (let s = 0; s <= maxStaffIndex; s++) {
                stavesData.push({
                    vfVoices: staffVoices[s],
                    beams: [], // Global Beams are now separate
                    vfTuplets: staffTuplets[s],
                    lyricConnectors: staffLyricConnectors[s], // Merge here
                    clef: measure.clefs[s] ? currentClefStrs[s] : undefined,
                    keySignature: measure.keys[s] || measure.measureNumber === 1 ? currentKeyStrs[s] : undefined,
                    timeSignature: measure.rhythms[s] ? currentTimeStrs[s] : undefined,
                    voltaType: s === 0 ? voltaType : VF.Volta.type.NONE,
                    voltaNumber: s === 0 ? measure.endingNumber : "",
                    label: measure.measureNumber === 1 ? staffInstrumentLabels[s] : undefined,

                    // Directions (Tempo & Rehearsal) - Only on Top Staff (typically)
                    tempos: s === 0 ? measure.tempos : [],
                    rehearsalMarks: s === 0 ? measure.rehearsalMarks : [],

                    // Piano Polish (Pedal & Octave Shift)
                    // Pedals usually on bottom staff (or specific staff from XML)
                    // Currently Reader puts all in measure.pedals. We can attach to bottom staff or pass all.
                    // For now, attaching to the specific staff would be best if we parsed <staff>.
                    // Reader didn't parse <staff> for pedal yet (default 1?). Let's put on LAST staff?
                    // Or just pass to all and let Drawer filter?
                    // Let's pass to current staff. Drawer can check if empty.
                    pedals: measure.pedals, // Passing to all, drawer logic can filter by staff index if we had it.
                    // But we don't have staff index in Parse. So just render on Bottom Staff (typical)?
                    octaveShifts: measure.octaveShifts.filter((o: any) => o.staffId === s + 1), // ONE-BASED INDEX Match

                    // Layout Distances (Pass through from SourceMeasure)
                    systemDistance: measure.systemDistance,
                    staffDistance: measure.staffDistance,
                    topSystemDistance: measure.topSystemDistance,

                    // Page Layout
                    printNewPage: measure.printNewPage,
                    pageLayout: measure.pageLayout
                });
            }

            // Map BarLineType to VexFlow
            let endBarLineType = undefined;
            if (measure.endBarType !== undefined) {
                switch (measure.endBarType) {
                    case BarLineType.Single: endBarLineType = VF.Barline.type.SINGLE; break;
                    case BarLineType.Double: endBarLineType = VF.Barline.type.DOUBLE; break;
                    case BarLineType.End: endBarLineType = VF.Barline.type.END; break;
                    case BarLineType.RepeatEnd: endBarLineType = VF.Barline.type.REPEAT_END; break;
                    case BarLineType.RepeatBegin: endBarLineType = VF.Barline.type.REPEAT_BEGIN; break;
                    default: endBarLineType = VF.Barline.type.SINGLE;
                }
            }

            preparedMeasures.push({
                measureNumber: measure.measureNumber,
                measureIndex: sheet.sourceMeasures.indexOf(measure),
                maxTicks: measureMaxTicks,
                staves: stavesData,
                beams: measureBeams,
                minWidth: minWidth,
                endBarLineType: endBarLineType,
                printNewSystem: measure.printNewSystem,
                printNewPage: measure.printNewPage
            });
        }

        // --- PASS 2: System Building & Justification ---

        // Configuration
        const minSystemFill = 0.5; // If system is > 50% full, justify it. Else left-align.

        for (const data of preparedMeasures) {
            // Check for Explicit System/Page Break
            const forceBreak = (data.printNewSystem || data.printNewPage) && currentSystem.length > 0;

            // Check for Width Overflow
            // Add a small buffer/padding per measure to account for bar lines/connectors
            let potentialWidth = currentSystemWidth + data.minWidth;

            // Heuristic: If we are just starting a line, we accept it even if it's too big (one measure system)
            const widthOverflow = potentialWidth > containerWidth && currentSystem.length > 0;

            if (forceBreak || widthOverflow) {
                // Determine layout strategy
                // 1. Calculate available space
                const totalMinWidth = currentSystemWidth;
                const availableSpace = containerWidth - totalMinWidth;

                // 2. Decide to Justify or Left-Align
                // If it's a forced break but the line is mostly full, we still justify.
                // If it's a natural overflow, we ALWAYS justify (stretch to fit).
                let justify = true;

                // Optional: If line is very empty (e.g. last line or forced break with 1 bar), don't stretch too much?
                // For now, standard music notation behavior is to stretch fully unless it's the very last system of score.
                // But for forced breaks (e.g. 4-bar phrases), we usually want full stretch.

                if (justify) {
                    // Distribute space proportionally based on minWidth
                    // Dense measures (large minWidth) get more absolute space, but proportional increase is fair.
                    const expansionRatio = availableSpace / totalMinWidth;

                    currentSystem.forEach(m => {
                        m.width = m.minWidth + (m.minWidth * expansionRatio);
                    });
                } else {
                    currentSystem.forEach(m => m.width = m.minWidth);
                }

                systems.push(currentSystem);
                currentSystem = [];
                currentSystemWidth = 0;
            }

            currentSystem.push(data);
            currentSystemWidth += data.minWidth;
        }

        if (currentSystem.length > 0) {
            // Last system: Ragged Right (Do not justify)
            // Unless it's very close to full? Most editions leave last line ragged.
            currentSystem.forEach(m => m.width = m.minWidth);
            systems.push(currentSystem);
        }



        // Build Maps for System tracking
        const vfNoteToSystem = new Map<any, number>();
        const vfNoteToStaff = new Map<any, number>();
        const systemStaffFirstLast = new Map<number, Map<number, { first: any, last: any }>>();

        // New: Track curves per system AND STAFF for layout
        const systemStaffCurves: Map<number, Map<number, any[]>> = new Map();
        const addToSystem = (sysIdx: number | undefined, curve: any, staffIndices: number[]) => {
            if (sysIdx === undefined) return;
            if (!systemStaffCurves.has(sysIdx)) systemStaffCurves.set(sysIdx, new Map());
            const sysMap = systemStaffCurves.get(sysIdx)!;

            staffIndices.forEach(sIdx => {
                if (!sysMap.has(sIdx)) sysMap.set(sIdx, []);
                sysMap.get(sIdx)?.push(curve);
            });
        };

        systems.forEach((system, sysIdx) => {
            if (!systemStaffFirstLast.has(sysIdx)) systemStaffFirstLast.set(sysIdx, new Map());

            system.forEach(measureData => {
                measureData.staves.forEach((staffData: any, staffIdx: number) => {
                    const voiceIds = Object.keys(staffData.vfVoices || {});
                    const notes: any[] = [];
                    voiceIds.forEach(vid => notes.push(...staffData.vfVoices[vid]));

                    if (notes.length > 0) {
                        notes.forEach(n => {
                            vfNoteToSystem.set(n, sysIdx);
                            vfNoteToStaff.set(n, staffIdx);
                        });

                        const sysMap = systemStaffFirstLast.get(sysIdx)!;
                        if (!sysMap.has(staffIdx)) {
                            sysMap.set(staffIdx, { first: notes[0], last: notes[notes.length - 1] });
                        } else {
                            sysMap.get(staffIdx)!.last = notes[notes.length - 1];
                        }
                    }
                });

                // Add Beams to System Curves (Cross-Staff support)
                if (measureData.beams) {
                    measureData.beams.forEach((beam: any) => {
                        const indices = new Set<number>();
                        beam.notes.forEach((n: any) => {
                            if (vfNoteToStaff.has(n)) indices.add(vfNoteToStaff.get(n)!);
                        });
                        addToSystem(sysIdx, beam, Array.from(indices));
                    });
                }
            });
        });

        // Generate Curves and Ties
        const curves: any[] = [];
        for (const slur of sheet.slurs) {
            if (slur.startNote && slur.endNote) {
                const vfStart = noteMap.get(slur.startNote);
                const vfEnd = noteMap.get(slur.endNote);

                if (vfStart && vfEnd) {
                    const sysStart = vfNoteToSystem.get(vfStart);
                    const sysEnd = vfNoteToSystem.get(vfEnd);

                    if (sysStart !== undefined && sysEnd !== undefined && sysStart !== sysEnd) {
                        // Split Curve
                        // Segment 1: Start -> End of Start System
                        const startStaffIdx = slur.startNote.staffId - 1;
                        const sysStartData = systemStaffFirstLast.get(sysStart)?.get(startStaffIdx);

                        // Segment 2: Start of End System -> End
                        const endStaffIdx = slur.endNote.staffId - 1;
                        const sysEndData = systemStaffFirstLast.get(sysEnd)?.get(endStaffIdx);

                        if (sysStartData && sysEndData) {
                            // console.log(`Split Slur: Sys ${sysStart} -> Sys ${sysEnd}`);
                            // Determine Invert based on Stem Direction
                            // Default (invert=false) is usually Above (Arc Up).
                            // If Stems are UP (1), we want Slur BELOW (invert=true).
                            // If Stems are DOWN (-1), we want Slur ABOVE (invert=false).

                            let invert = false;
                            try {
                                const stem1 = vfStart.getStemDirection();
                                const stem2 = vfEnd.getStemDirection();
                                if (stem1 === VF.Stem.UP) invert = true;
                            } catch (e) {
                                // Fallback to Octave
                                invert = slur.startNote.pitch.octave >= 5;
                            }

                            const curve1 = new VF.Curve(vfStart, sysStartData.last, {
                                thickness: 2,
                                xShift: 0,
                                yShift: 10,
                                invert: 1 ? invert : false // Force usage?
                            });
                            // Fix: VF.Curve constructor signature might vary. 
                            // We are using options object.
                            // Re-instantiate properly.

                            const curve1_new = new VF.Curve(vfStart, sysStartData.last, {
                                thickness: 2,
                                xShift: 0,
                                yShift: 10,
                                invert: invert
                            });

                            curves.push(curve1_new);
                            addToSystem(sysStart, curve1_new, [startStaffIdx]);

                            const curve2_new = new VF.Curve(sysEndData.first, vfEnd, {
                                thickness: 2,
                                xShift: 0,
                                yShift: 10,
                                invert: invert
                            });
                            curves.push(curve2_new);
                            addToSystem(sysEnd, curve2_new, [endStaffIdx]);
                        } else {
                            // Fallback if system boundary notes not found (should be rare)
                            console.warn("Cross-system slur missing boundary notes, skipping to avoid diagonal.");
                        }
                    } else {
                        // Normal Single Curve
                        let invert = false;
                        try {
                            const stem1 = vfStart.getStemDirection();
                            if (stem1 === VF.Stem.UP) invert = true; // Stem Up -> Slur Below
                        } catch (e) {
                            invert = slur.startNote.pitch.octave >= 5;
                        }

                        const curve = new VF.Curve(vfStart, vfEnd, {
                            thickness: 2,
                            xShift: 0,
                            yShift: 10,
                            invert: invert
                        });
                        curves.push(curve);

                        // Add to both start and end staff indices if different (cross-staff)
                        const s1 = slur.startNote.staffId - 1;
                        const s2 = slur.endNote.staffId - 1;
                        const indices = s1 === s2 ? [s1] : [s1, s2];
                        addToSystem(sysStart, curve, indices);
                    }
                }
            }
        }

        for (const tie of sheet.ties) {
            if (tie.startNote && tie.endNote) {
                const vfStart = noteMap.get(tie.startNote);
                const vfEnd = noteMap.get(tie.endNote);
                if (vfStart && vfEnd) {
                    const staveTie = new VF.StaveTie({
                        firstNote: vfStart,
                        lastNote: vfEnd,
                        firstIndexes: [0],
                        lastIndexes: [0]
                    });
                    curves.push(staveTie);

                    const sys = vfNoteToSystem.get(vfStart);
                    const s1 = tie.startNote.staffId - 1;
                    const s2 = tie.endNote.staffId - 1;
                    // Ties usually same staff, but be safe
                    addToSystem(sys, staveTie, [s1, s2]);
                }
            }
        }

        // Generate Hairpins (Wedges)
        for (const wedge of sheet.wedges) {
            if (wedge.startNote && wedge.endNote) {
                const vfStart = noteMap.get(wedge.startNote);
                const vfEnd = noteMap.get(wedge.endNote);
                if (vfStart && vfEnd) {
                    const hairpin = new VF.StaveHairpin(
                        { firstNote: vfStart, lastNote: vfEnd },
                        wedge.type === WedgeType.Crescendo ? VF.StaveHairpin.type.CRESC : VF.StaveHairpin.type.DECRESC
                    );
                    hairpin.setPosition(VF.Modifier.Position.BELOW); // Hairpins are usually below
                    curves.push(hairpin);

                    const sys = vfNoteToSystem.get(vfStart);
                    const s1 = wedge.startNote.staffId - 1;
                    const s2 = wedge.endNote.staffId - 1;
                    addToSystem(sys, hairpin, [s1, s2]);
                }
            }
        }

        // Generate Octave Shifts
        for (const shift of sheet.octaveShifts) {
            if (shift.startNote && shift.endNote) {
                const vfStart = noteMap.get(shift.startNote);
                const vfEnd = noteMap.get(shift.endNote);
                if (vfStart && vfEnd) {
                    const text = shift.type === OctaveShiftType.Up ? "8va" : "8vb";
                    const position = shift.type === OctaveShiftType.Up ? VF.TextBracket.Position.TOP : VF.TextBracket.Position.BOTTOM;
                    const bracket = new VF.TextBracket({
                        start: vfStart,
                        stop: vfEnd,
                        text: text,
                        position: position
                    });
                    curves.push(bracket);

                    const sys = vfNoteToSystem.get(vfStart);
                    const s1 = shift.startNote.staffId - 1;
                    addToSystem(sys, bracket, [s1]);
                }
            }
        }

        // Post-Process: Ensure Key Signature on System Starts
        systems.forEach((system, sysIdx) => {
            // Always ensure first measure of system has Key Signature (standard music notation)
            // strict: Time Signatures usually only check on change, but Key Signatures appear on every system start.
            const firstMeasure = system[0];
            if (firstMeasure) {
                firstMeasure.staves.forEach((staff: any) => {
                    // Force Clef at start of System if not already present
                    if (!staff.clef && staff.activeClef) {
                        staff.clef = staff.activeClef;
                        // Add padding? Stave.addClef automatically handles some spacing in VexFlow 
                        // but our measure width was pre-calculated.
                        // Ideally we should add width, but since we already justified the system to full width,
                        // there might be room. If not, it might overlap notes.
                        // To be safe, we should have accounted for this in minWidth.
                        // But finding "start of system" happens AFTER justification.
                        // This is a known chicken-and-egg problem in layout engines.
                        // For Mini-OSMD, we accept slight cramping to gain correctness.
                    }

                    if (!staff.keySignature && staff.activeKeySignature) {
                        staff.keySignature = staff.activeKeySignature;
                    }
                });
            }
        });

        return {
            systems,
            curves,
            noteMap,
            partGroups: sheet.partGroups,
            metadata: {
                title: sheet.Title,
                composer: sheet.Composer
            },
            systemStaffCurves // Export Map
        };
    }
}