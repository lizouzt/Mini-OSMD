import Vex from "vexflow";
import { MusicSheet } from "../../MusicSheet";
import { GraphicalMusicSheet } from "../GraphicalMusicSheet";
import { NoteEnum } from "../../VoiceData/Pitch";
import { ClefEnum } from "../../VoiceData/Instructions/ClefInstruction";
import { BarLineType, EndingType } from "../../VoiceData/SourceMeasure";
import { WedgeType } from "../../VoiceData/Wedge";
import { OctaveShiftType } from "../../VoiceData/OctaveShift";
import { Note } from "../../VoiceData/Note";
import { Tuplet } from "../../VoiceData/Tuplet";

const VF = Vex.Flow;

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

    public static format(graphicalSheet: GraphicalMusicSheet, containerWidth: number = 1000): { systems: any[][], curves: any[] } {
        const systems: any[][] = [];
        let currentSystem: any[] = [];
        let currentSystemWidth = 0;
        const sheet = graphicalSheet.musicSheet;
        
        // Map logical Note to VexFlow StaveNote for linking expressions (Slurs)
        const noteMap = new Map<any, any>();

        // Track current state across measures for EACH staff
        // Index 0 = Staff 1
        const currentClefStrs: string[] = ["treble", "bass"]; 
        const currentTimeStrs: string[] = ["4/4", "4/4"];
        const currentKeyStrs: string[] = ["C", "C"]; // Track Key
        
        let activeVolta = false;

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
                        for (const n of mainNotes) {
                            const stepName = NoteEnum[n.pitch.step].toLowerCase();
                            keys.push(`${stepName}/${n.pitch.octave}`);
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
                        
                        const vfNote = new VF.StaveNote({
                            clef: currentClefStrs[s] || "treble",
                            keys: keys,
                            duration: duration,
                        });
                        
                        // Attach source note for cursor mapping
                        (vfNote as any).sourceNote = mainNote;

                        // Add Accidentals
                        mainNotes.forEach((n, index) => {
                            if (n.pitch.alter !== 0) {
                                let acc = "";
                                if (n.pitch.alter === 1) acc = "#";
                                else if (n.pitch.alter === -1) acc = "b";
                                else if (n.pitch.alter === 2) acc = "##";
                                else if (n.pitch.alter === -2) acc = "bb";
                                if (acc) vfNote.addAccidental(index, new VF.Accidental(acc));
                            }
                            
                            // Add Articulations
                            n.articulations.forEach(art => {
                                let vfArt = "";
                                let pos = VF.Modifier.Position.ABOVE; // Default
                                if (art === "staccato") { vfArt = "a."; pos = VF.Modifier.Position.BELOW; } // Staccato often below/above opposite to stem
                                else if (art === "accent") vfArt = "a>";
                                else if (art === "marcato") vfArt = "a^";
                                else if (art === "tenuto") vfArt = "a-";
                                else if (art === "fermata") vfArt = "a@a";
                                
                                if (vfArt) {
                                    const modifier = new VF.Articulation(vfArt);
                                    // Let VexFlow handle position automatically or hint it?
                                    // For simplicity, let VF handle it, but sometimes hints help.
                                    vfNote.addModifier(index, modifier);
                                }
                            });
                            
                            // Add Dynamics
                            if (n.dynamics && n.dynamics.length > 0) {
                                n.dynamics.forEach(dyn => {
                                    const vfDyn = new VF.TextDynamics({
                                        text: dyn,
                                        duration: "q" // Duration doesn't matter much for TextDynamics attached to note
                                    });
                                    vfNote.addModifier(index, vfDyn);
                                });
                            }
                        });
                        
                        // Add Lyrics
                        if (mainNote.lyrics && mainNote.lyrics.length > 0) {
                            mainNote.lyrics.forEach(lyric => {
                                const text = lyric.text + (lyric.syllabic === "begin" || lyric.syllabic === "middle" ? "-" : "");
                                const annotation = new VF.Annotation(text)
                                    .setFont("Times", 12, "normal")
                                    .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
                                vfNote.addModifier(0, annotation);
                            });
                        }

                         // Handle Grace Notes
                        const combinedGraceNotes = [...graceNotesQueue, ...graceNotes];
                        if (combinedGraceNotes.length > 0) {
                            const vfGraceNotes = combinedGraceNotes.map(gn => {
                                const gnStep = NoteEnum[gn.pitch.step].toLowerCase();
                                const gvfNote = new VF.GraceNote({
                                    keys: [`${gnStep}/${gn.pitch.octave}`],
                                    duration: "8",
                                    slash: true
                                });
                                if (gn.pitch.alter !== 0) {
                                    let acc = "";
                                    if (gn.pitch.alter === 1) acc = "#";
                                    else if (gn.pitch.alter === -1) acc = "b";
                                    if (acc) gvfNote.addAccidental(0, new VF.Accidental(acc));
                                }
                                return gvfNote;
                            });
                            const graceNoteGroup = new VF.GraceNoteGroup(vfGraceNotes);
                            vfNote.addModifier(0, graceNoteGroup);
                            graceNotesQueue = [];
                        }

                        // Stem Direction
                        if (vid === "1") vfNote.setStemDirection(VF.StaveNote.STEM_UP);
                        else vfNote.setStemDirection(VF.StaveNote.STEM_DOWN);

                        staffVoices[s][vid].push(vfNote);

                        for (const n of notes) {
                            noteMap.set(n, vfNote);
                        }
                    }
                }
                
                // Tuplets for this staff
                 // Generate Tuplets (checking notes belonging to this staff)
                const processedTuplets = new Set<Tuplet>();
                for (const note of measure.notes) {
                    if (note.staffId - 1 === s && note.tuplet && !processedTuplets.has(note.tuplet)) {
                        const logicalTuplet = note.tuplet;
                        const tupletVfNotes = logicalTuplet.notes
                            .map(n => noteMap.get(n))
                            .filter((v, i, a) => v && a.indexOf(v) === i); 
                        
                        if (tupletVfNotes.length > 0) {
                            const vfTuplet = new VF.Tuplet(tupletVfNotes, {
                                num_notes: logicalTuplet.actualNotes,
                                notes_occupied: logicalTuplet.normalNotes
                            });
                            staffTuplets[s].push(vfTuplet);
                        }
                        processedTuplets.add(logicalTuplet);
                    }
                }
            }

            // Calculate Width (Max of all staves)
            let minWidth = 150;
            // Iterate all staves to find max required width
            for (let s = 0; s <= maxStaffIndex; s++) {
                const tempVoices: any[] = [];
                for (const vid in staffVoices[s]) {
                    const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
                    voice.addTickables(staffVoices[s][vid]);
                    tempVoices.push(voice);
                }
                
                if (tempVoices.length > 0) {
                    try {
                         const formatter = new VF.Formatter();
                         const w = formatter.joinVoices(tempVoices).preCalculateMinTotalWidth(tempVoices);
                         
                         let padding = 20;
                         if (measure.clefs[s] || measure.measureNumber === 1) padding += 40;
                         if (measure.rhythms[s] || measure.measureNumber === 1) padding += 30;
                         if (measure.keys[s]) padding += 20;
                         
                         minWidth = Math.max(minWidth, w + padding);
                    } catch(e) {}
                }
            }

            // Build staves data
            const stavesData = [];
            for (let s = 0; s <= maxStaffIndex; s++) {
                // Beams
                const allBeams: any[] = [];
                for (const vid in staffVoices[s]) {
                     const beams = VF.Beam.generateBeams(staffVoices[s][vid]);
                     allBeams.push(...beams);
                }

                stavesData.push({
                    vfVoices: staffVoices[s],
                    beams: allBeams,
                    vfTuplets: staffTuplets[s],
                    clef: measure.clefs[s] ? currentClefStrs[s] : undefined,
                    keySignature: measure.keys[s] || measure.measureNumber === 1 ? currentKeyStrs[s] : undefined, // Draw if explicit or start
                    timeSignature: measure.rhythms[s] ? currentTimeStrs[s] : undefined,
                    voltaType: s === 0 ? voltaType : VF.Volta.type.NONE,
                    voltaNumber: s === 0 ? measure.endingNumber : ""
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

            const measureData = {
                measureNumber: measure.measureNumber,
                staves: stavesData, // New structure
                width: minWidth,
                endBarLineType: endBarLineType
            };

            // Justified Layout Logic
            // We accumulate measures into the current system until they overflow
            if (currentSystemWidth + measureData.width > containerWidth && currentSystem.length > 0) {
                // System is full. Distribute extra space.
                const extraSpace = containerWidth - currentSystemWidth;
                const extraPerMeasure = extraSpace / currentSystem.length;
                currentSystem.forEach(m => m.width += extraPerMeasure);

                systems.push(currentSystem);
                currentSystem = [];
                currentSystemWidth = 0;
            }
            
            currentSystem.push(measureData);
            currentSystemWidth += measureData.width;
        }

        // Add last system (do not stretch last system usually, or stretch partially?)
        // Standard practice: Just leave it left-aligned or stretch if close to full.
        // For simple rendering, let's leave it as is (ragged right).
        if (currentSystem.length > 0) {
            systems.push(currentSystem);
        }

        // Generate Curves and Ties
        const curves: any[] = [];
        for (const slur of sheet.slurs) {
            if (slur.startNote && slur.endNote) {
                const vfStart = noteMap.get(slur.startNote);
                const vfEnd = noteMap.get(slur.endNote);
                
                if (vfStart && vfEnd) {
                    const curve = new VF.Curve(vfStart, vfEnd, {
                        thickness: 2,
                        x_shift: 0,
                        y_shift: 10
                    });
                    curves.push(curve);
                }
            }
        }
        
        for (const tie of sheet.ties) {
            if (tie.startNote && tie.endNote) {
                const vfStart = noteMap.get(tie.startNote);
                const vfEnd = noteMap.get(tie.endNote);
                if (vfStart && vfEnd) {
                    const staveTie = new VF.StaveTie({
                        first_note: vfStart,
                        last_note: vfEnd,
                        first_indices: [0],
                        last_indices: [0]
                    });
                    curves.push(staveTie);
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
                        { first_note: vfStart, last_note: vfEnd },
                        wedge.type === WedgeType.Crescendo ? VF.StaveHairpin.type.CRESC : VF.StaveHairpin.type.DESC
                    );
                    hairpin.setPosition(VF.Modifier.Position.BELOW); // Hairpins are usually below
                    curves.push(hairpin);
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
                    const position = shift.type === OctaveShiftType.Up ? VF.TextBracket.Positions.TOP : VF.TextBracket.Positions.BOTTOM;
                    const bracket = new VF.TextBracket({
                        start: vfStart,
                        stop: vfEnd,
                        text: text,
                        position: position
                    });
                    curves.push(bracket);
                }
            }
        }

        return { systems, curves };
    }
}
