import { MusicSheet, Instrument, PartGroup } from "../../MusicalScore/MusicSheet";
import { SourceMeasure } from "../../MusicalScore/VoiceData/SourceMeasure";
import { Note } from "../../MusicalScore/VoiceData/Note";
import { Pitch } from "../../MusicalScore/VoiceData/Pitch";
import { Fraction } from "../../Common/DataObjects/Fraction";
import { ClefInstruction } from "../../MusicalScore/VoiceData/Instructions/ClefInstruction";
import { KeyInstruction } from "../../MusicalScore/VoiceData/Instructions/KeyInstruction";
import { RhythmInstruction } from "../../MusicalScore/VoiceData/Instructions/RhythmInstruction";
import { Slur } from "../../MusicalScore/VoiceData/Slur";
import { Tie } from "../../MusicalScore/VoiceData/Tie";
import { Tuplet } from "../../MusicalScore/VoiceData/Tuplet";
import { Wedge } from "../../MusicalScore/VoiceData/Wedge";
import { OctaveShift } from "../../MusicalScore/VoiceData/OctaveShift";
import { ChordSymbolContainer } from "../../MusicalScore/VoiceData/ChordSymbolContainer";

export class MusicSheetHydrator {
    public static hydrate(data: any): MusicSheet {
        // console.log("Hydrator: Starting...", data);
        if (!data) throw new Error("Hydration Input is null/undefined");

        // Re-assign prototype for MusicSheet
        Object.setPrototypeOf(data, MusicSheet.prototype);
        const sheet = data as MusicSheet;

        // Restore Instruments
        if (sheet.instruments && Array.isArray(sheet.instruments)) {
            sheet.instruments.forEach(inst => Object.setPrototypeOf(inst, Instrument.prototype));
        }

        // Restore PartGroups
        if (sheet.partGroups && Array.isArray(sheet.partGroups)) {
            sheet.partGroups.forEach(pg => Object.setPrototypeOf(pg, PartGroup.prototype));
        }

        // Restore SourceMeasures
        if (sheet.sourceMeasures && Array.isArray(sheet.sourceMeasures)) {
            sheet.sourceMeasures.forEach((measure, idx) => {
                Object.setPrototypeOf(measure, SourceMeasure.prototype);

                // Restore Instructions (Maps/Arrays)
                if (measure.clefs && Array.isArray(measure.clefs)) {
                    measure.clefs.forEach(c => {
                        if (c) Object.setPrototypeOf(c, ClefInstruction.prototype);
                    });
                }
                if (measure.keys && Array.isArray(measure.keys)) {
                    measure.keys.forEach(k => {
                        if (k) Object.setPrototypeOf(k, KeyInstruction.prototype);
                    });
                }
                if (measure.rhythms && Array.isArray(measure.rhythms)) {
                    measure.rhythms.forEach(r => {
                        if (r) Object.setPrototypeOf(r, RhythmInstruction.prototype);
                    });
                }

                // Restore Notes
                if (measure.notes && Array.isArray(measure.notes)) {
                    measure.notes.forEach(note => {
                        Object.setPrototypeOf(note, Note.prototype);
                        if (note.pitch) Object.setPrototypeOf(note.pitch, Pitch.prototype);
                        if (note.length) Object.setPrototypeOf(note.length, Fraction.prototype);
                        if (note.timestamp) Object.setPrototypeOf(note.timestamp, Fraction.prototype);
                        if (note.tuplet) Object.setPrototypeOf(note.tuplet, Tuplet.prototype);

                        if (note.slurStarts && Array.isArray(note.slurStarts)) note.slurStarts.forEach(s => Object.setPrototypeOf(s, Slur.prototype));
                        if (note.tieStarts && Array.isArray(note.tieStarts)) note.tieStarts.forEach(t => Object.setPrototypeOf(t, Tie.prototype));
                    });
                }

                // Restore Chords
                if (measure.chordSymbols && Array.isArray(measure.chordSymbols)) {
                    measure.chordSymbols.forEach(chord => {
                        Object.setPrototypeOf(chord, ChordSymbolContainer.prototype);
                        if (chord.RootPitch) Object.setPrototypeOf(chord.RootPitch, Pitch.prototype);
                        if (chord.BassPitch) Object.setPrototypeOf(chord.BassPitch, Pitch.prototype);
                    });
                }
            });
        }

        // Global lists
        if (sheet.slurs && Array.isArray(sheet.slurs)) sheet.slurs.forEach(s => Object.setPrototypeOf(s, Slur.prototype));
        if (sheet.ties && Array.isArray(sheet.ties)) sheet.ties.forEach(t => Object.setPrototypeOf(t, Tie.prototype));
        if (sheet.wedges && Array.isArray(sheet.wedges)) sheet.wedges.forEach(w => Object.setPrototypeOf(w, Wedge.prototype));
        if (sheet.octaveShifts && Array.isArray(sheet.octaveShifts)) sheet.octaveShifts.forEach(o => Object.setPrototypeOf(o, OctaveShift.prototype));

        return sheet;
    }
}
