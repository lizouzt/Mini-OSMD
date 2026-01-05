import { MusicSheet } from "../MusicSheet";
import { SourceMeasure, BarLineType, EndingType } from "../VoiceData/SourceMeasure";
import { Note } from "../VoiceData/Note";
import { Pitch, NoteEnum } from "../VoiceData/Pitch";
import { Fraction } from "../../Common/DataObjects/Fraction";
import { ClefInstruction, ClefEnum } from "../VoiceData/Instructions/ClefInstruction";
import { KeyInstruction } from "../VoiceData/Instructions/KeyInstruction";
import { RhythmInstruction } from "../VoiceData/Instructions/RhythmInstruction";
import { Slur } from "../VoiceData/Slur";
import { Tuplet } from "../VoiceData/Tuplet";
import { Tie } from "../VoiceData/Tie";
import { Wedge, WedgeType } from "../VoiceData/Wedge";
import { OctaveShift, OctaveShiftType } from "../VoiceData/OctaveShift";

export class MusicSheetReader {
    public static readMusicXML(xmlString: string): MusicSheet {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const sheet = new MusicSheet();
        
        const parts = xmlDoc.getElementsByTagName("part");
        let globalStaffOffset = 0;

        for (let p = 0; p < parts.length; p++) {
            const part = parts[p];
            const measures = part.getElementsByTagName("measure");
            
            // Per-part state
            let divisions = 4;
            let partMaxStaves = 1; 

            // Track open notations for THIS part
            const openSlurs: { [number: number]: Slur } = {};
            const openTies: { [number: number]: Tie } = {};
            let activeWedge: Wedge | undefined = undefined;
            let activeOctaveShift: OctaveShift | undefined = undefined;
            let activeTuplet: Tuplet | undefined = undefined;

            let cursor = new Fraction(0, 1);

            for (let i = 0; i < measures.length; i++) {
                const xmlMeasure = measures[i];
                const measureNumber = parseInt(xmlMeasure.getAttribute("number") || "0");
                
                // Get or Create SourceMeasure
                // We assume parts are aligned by index. 
                // Ideally we should map by measureNumber, but simple index alignment is common for MusicXML.
                let measure: SourceMeasure;
                if (sheet.sourceMeasures.length <= i) {
                    measure = new SourceMeasure(measureNumber);
                    sheet.addMeasure(measure);
                } else {
                    measure = sheet.sourceMeasures[i];
                }

                // Parse Attributes
                const attributes = xmlMeasure.getElementsByTagName("attributes")[0];
                if (attributes) {
                    const divsNode = attributes.getElementsByTagName("divisions")[0];
                    if (divsNode) divisions = parseInt(divsNode.textContent || "4");
                    
                    const stavesNode = attributes.getElementsByTagName("staves")[0];
                    if (stavesNode) {
                        const val = parseInt(stavesNode.textContent || "1");
                        partMaxStaves = Math.max(partMaxStaves, val);
                    }

                    const clefs = attributes.getElementsByTagName("clef");
                    for (let c = 0; c < clefs.length; c++) {
                        const clef = clefs[c];
                        const num = parseInt(clef.getAttribute("number") || "1");
                        const sign = clef.getElementsByTagName("sign")[0]?.textContent;
                        const line = parseInt(clef.getElementsByTagName("line")[0]?.textContent || "0");
                        let clefEnum = ClefEnum.G;
                        if (sign === "F") clefEnum = ClefEnum.F;
                        if (sign === "C") clefEnum = ClefEnum.C;
                        
                        const globalIndex = globalStaffOffset + (num - 1);
                        measure.clefs[globalIndex] = new ClefInstruction(clefEnum, line);
                    }

                    const keys = attributes.getElementsByTagName("key");
                    for (let k = 0; k < keys.length; k++) {
                        const key = keys[k];
                        const num = parseInt(key.getAttribute("number") || "1");
                        const fifths = parseInt(key.getElementsByTagName("fifths")[0]?.textContent || "0");
                        const mode = key.getElementsByTagName("mode")[0]?.textContent || "major";
                        
                        const globalIndex = globalStaffOffset + (num - 1);
                        measure.keys[globalIndex] = new KeyInstruction(fifths, mode);
                    }

                    const times = attributes.getElementsByTagName("time");
                    for (let t = 0; t < times.length; t++) {
                        const time = times[t];
                        const num = parseInt(time.getAttribute("number") || "1");
                        const beats = parseInt(time.getElementsByTagName("beats")[0]?.textContent || "4");
                        const beatType = parseInt(time.getElementsByTagName("beat-type")[0]?.textContent || "4");
                        
                        const globalIndex = globalStaffOffset + (num - 1);
                        measure.rhythms[globalIndex] = new RhythmInstruction(beats, beatType);
                    }
                }

                // Parse BarLines
                const barlines = xmlMeasure.getElementsByTagName("barline");
                for (let k = 0; k < barlines.length; k++) {
                    const bl = barlines[k];
                    const location = bl.getAttribute("location");
                    
                    // Ending (Volta)
                    const ending = bl.getElementsByTagName("ending")[0];
                    if (ending) {
                         const num = ending.getAttribute("number") || "";
                         const type = ending.getAttribute("type") || "start";
                         measure.endingNumber = num;
                         
                         if (type === "start") {
                             measure.endingType = measure.endingType === EndingType.Stop ? EndingType.StartStop : EndingType.Start;
                         } else if (type === "stop" || type === "discontinue") {
                             measure.endingType = measure.endingType === EndingType.Start ? EndingType.StartStop : EndingType.Stop;
                         }
                    }

                    if (location === "right" || !location) {
                        const barStyle = bl.getElementsByTagName("bar-style")[0]?.textContent;
                        const repeat = bl.getElementsByTagName("repeat")[0];
                        if (repeat && repeat.getAttribute("direction") === "backward") measure.endBarType = BarLineType.RepeatEnd;
                        else if (barStyle === "light-heavy") measure.endBarType = BarLineType.End;
                        else if (barStyle === "light-light") measure.endBarType = BarLineType.Double;
                    } else if (location === "left") {
                         const repeat = bl.getElementsByTagName("repeat")[0];
                         if (repeat && repeat.getAttribute("direction") === "forward") measure.endBarType = BarLineType.RepeatBegin;
                    }
                }

                // Iterate Children
                const children = xmlMeasure.children;
                let lastNoteTimestamp = new Fraction(0, 1);
                let pendingDynamics: string[] = [];

                for (let j = 0; j < children.length; j++) {
                    const child = children[j];
                    if (child.tagName === "direction") {
                        const type = child.getElementsByTagName("direction-type")[0];
                        if (type) {
                            // Dynamics
                            const dyns = type.getElementsByTagName("dynamics")[0];
                            if (dyns) {
                                for (let d = 0; d < dyns.children.length; d++) pendingDynamics.push(dyns.children[d].tagName);
                            }
                            // Wedge
                            const wedge = type.getElementsByTagName("wedge")[0];
                            if (wedge) {
                                const wType = wedge.getAttribute("type");
                                if (wType === "crescendo" || wType === "diminuendo") {
                                    activeWedge = new Wedge(wType === "crescendo" ? WedgeType.Crescendo : WedgeType.Diminuendo);
                                    sheet.wedges.push(activeWedge);
                                } else if (wType === "stop") {
                                    activeWedge = undefined;
                                }
                            }
                            // Octave Shift
                            const octaveShift = type.getElementsByTagName("octave-shift")[0];
                            if (octaveShift) {
                                const oType = octaveShift.getAttribute("type");
                                if (oType === "up" || oType === "down") {
                                    activeOctaveShift = new OctaveShift(oType === "up" ? OctaveShiftType.Up : OctaveShiftType.Down);
                                    sheet.octaveShifts.push(activeOctaveShift);
                                } else if (oType === "stop") {
                                    activeOctaveShift = undefined;
                                }
                            }
                        }
                    } else if (child.tagName === "note") {
                        const isChord = child.getElementsByTagName("chord").length > 0;
                        const isGrace = child.getElementsByTagName("grace").length > 0;
                        let noteTimestamp = isChord ? lastNoteTimestamp.clone() : cursor.clone();
                        if (!isChord) lastNoteTimestamp = cursor.clone();

                        const note = this.parseNote(child, divisions, noteTimestamp);
                        if (note) {
                            // Update Staff ID with Offset
                            note.staffId += globalStaffOffset;
                            
                            note.isGrace = isGrace;
                            if (pendingDynamics.length > 0 && !isChord) {
                                note.dynamics.push(...pendingDynamics);
                                pendingDynamics = [];
                            }
                            
                            if (activeWedge) {
                                if (!activeWedge.startNote) activeWedge.startNote = note;
                                activeWedge.endNote = note;
                            }
                            if (activeOctaveShift) {
                                if (!activeOctaveShift.startNote) activeOctaveShift.startNote = note;
                                activeOctaveShift.endNote = note;
                            }

                            // Notations
                            const notations = child.getElementsByTagName("notations")[0];
                            if (notations) {
                                // Slurs
                                const slurs = notations.getElementsByTagName("slur");
                                for (let k = 0; k < slurs.length; k++) {
                                    const s = slurs[k];
                                    const num = parseInt(s.getAttribute("number") || "1");
                                    if (s.getAttribute("type") === "start") {
                                        const slur = new Slur();
                                        slur.startNote = note;
                                        note.slurStarts.push(slur);
                                        openSlurs[num] = slur;
                                        sheet.slurs.push(slur);
                                    } else {
                                        const slur = openSlurs[num];
                                        if (slur) { slur.endNote = note; note.slurEnds.push(slur); delete openSlurs[num]; }
                                    }
                                }
                                // Ties
                                const ties = notations.getElementsByTagName("tied");
                                for (let k = 0; k < ties.length; k++) {
                                    const t = ties[k];
                                    const num = parseInt(t.getAttribute("number") || "1");
                                    if (t.getAttribute("type") === "start") {
                                        const tie = new Tie();
                                        tie.startNote = note;
                                        note.tieStarts.push(tie);
                                        openTies[num] = tie;
                                        sheet.ties.push(tie);
                                    } else {
                                        const tie = openTies[num];
                                        if (tie) { tie.endNote = note; note.tieEnds.push(tie); delete openTies[num]; }
                                    }
                                }
                                // Tuplets
                                const tuplet = notations.getElementsByTagName("tuplet")[0];
                                if (tuplet) {
                                    if (tuplet.getAttribute("type") === "start") {
                                        const tm = child.getElementsByTagName("time-modification")[0];
                                        activeTuplet = new Tuplet(
                                            parseInt(tm?.getElementsByTagName("actual-notes")[0]?.textContent || "3"),
                                            parseInt(tm?.getElementsByTagName("normal-notes")[0]?.textContent || "2")
                                        );
                                    }
                                    if (activeTuplet) { note.tuplet = activeTuplet; activeTuplet.notes.push(note); }
                                    if (tuplet.getAttribute("type") === "stop") activeTuplet = undefined;
                                } else if (activeTuplet) {
                                    note.tuplet = activeTuplet; activeTuplet.notes.push(note);
                                }
                                // Articulations
                                const arts = notations.getElementsByTagName("articulations")[0];
                                if (arts) {
                                    if (arts.getElementsByTagName("staccato").length > 0) note.articulations.push("staccato");
                                    if (arts.getElementsByTagName("accent").length > 0) note.articulations.push("accent");
                                    if (arts.getElementsByTagName("strong-accent").length > 0) note.articulations.push("marcato");
                                    if (arts.getElementsByTagName("tenuto").length > 0) note.articulations.push("tenuto");
                                }
                                if (notations.getElementsByTagName("fermata").length > 0) note.articulations.push("fermata");
                            }
                            
                            const lyrics = child.getElementsByTagName("lyric");
                            for (let l = 0; l < lyrics.length; l++) {
                                const lyric = lyrics[l];
                                note.lyrics.push({
                                    text: lyric.getElementsByTagName("text")[0]?.textContent || "",
                                    syllabic: lyric.getElementsByTagName("syllabic")[0]?.textContent || "single"
                                });
                            }

                            if (!isChord && !isGrace) cursor = Fraction.Plus(cursor, note.length);
                            measure.addNote(note);
                        }
                    } else if (child.tagName === "backup") {
                        const d = parseInt(child.getElementsByTagName("duration")[0]?.textContent || "0");
                        const f = new Fraction(d, divisions * 4); f.numerator *= -1; cursor = Fraction.Plus(cursor, f);
                    } else if (child.tagName === "forward") {
                        const d = parseInt(child.getElementsByTagName("duration")[0]?.textContent || "0");
                        cursor = Fraction.Plus(cursor, new Fraction(d, divisions * 4));
                    }
                }
            }
            globalStaffOffset += partMaxStaves;
        }
        return sheet;
    }

    private static parseNote(xmlNote: Element, divisions: number, timestamp: Fraction): Note | undefined {
        const type = xmlNote.getElementsByTagName("type")[0]?.textContent || "quarter";
        const voice = xmlNote.getElementsByTagName("voice")[0]?.textContent || "1";
        const staff = parseInt(xmlNote.getElementsByTagName("staff")[0]?.textContent || "1");
        const dur = parseInt(xmlNote.getElementsByTagName("duration")[0]?.textContent || "1");
        
        const rest = xmlNote.getElementsByTagName("rest")[0];
        const pitchEl = xmlNote.getElementsByTagName("pitch")[0];
        
        let pitch: Pitch;
        let isRest = false;

        if (rest) {
            isRest = true;
            pitch = new Pitch(NoteEnum.B, 4, 0); // VexFlow default rest position
        } else if (pitchEl) {
            const step = NoteEnum[pitchEl.getElementsByTagName("step")[0]?.textContent as keyof typeof NoteEnum] || NoteEnum.C;
            const oct = parseInt(pitchEl.getElementsByTagName("octave")[0]?.textContent || "4");
            const alt = parseInt(pitchEl.getElementsByTagName("alter")[0]?.textContent || "0");
            pitch = new Pitch(step, oct, alt);
        } else {
            return undefined;
        }

        const note = new Note(pitch, new Fraction(dur, divisions * 4), type, voice, timestamp, staff);
        note.isRest = isRest;
        return note;
    }
}