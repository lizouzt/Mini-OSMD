import { describe, it, expect } from 'vitest';
import { MusicSheetReader } from '../src/MusicalScore/ScoreIO/MusicSheetReader';
import { NoteEnum } from '../src/MusicalScore/VoiceData/Pitch';

describe('MusicSheetReader', () => {
    it('should parse a simple MusicXML string', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise version="3.1">
          <part-list>
            <score-part id="P1">
              <part-name>Test Part</part-name>
            </score-part>
          </part-list>
          <part id="P1">
            <measure number="1">
              <attributes>
                <divisions>1</divisions>
                <key><fifths>0</fifths></key>
                <time><beats>4</beats><beat-type>4</beat-type></time>
                <clef><sign>G</sign><line>2</line></clef>
              </attributes>
              <note>
                <pitch><step>C</step><octave>4</octave></pitch>
                <duration>1</duration>
                <type>quarter</type>
              </note>
            </measure>
          </part>
        </score-partwise>`;

        const sheet = MusicSheetReader.readMusicXML(xml);
        expect(sheet).toBeDefined();
        expect(sheet.sourceMeasures.length).toBe(1);
        expect(sheet.sourceMeasures[0].notes.length).toBe(1);
        expect(sheet.sourceMeasures[0].notes[0].pitch.step).toBe(NoteEnum.C);
    });

    it('should parse grace notes correctly', () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <score-partwise>
          <part-list><score-part id="P1"/></part-list>
          <part id="P1">
            <measure number="1">
              <note>
                <grace slash="yes"/>
                <pitch><step>D</step><octave>5</octave></pitch>
                <duration>0</duration>
                <type>eighth</type>
              </note>
            </measure>
          </part>
        </score-partwise>`;

        const sheet = MusicSheetReader.readMusicXML(xml);
        const note = sheet.sourceMeasures[0].notes[0];
        expect(note.isGrace).toBe(true);
        expect(note.graceSlash).toBe(true);
    });
});
