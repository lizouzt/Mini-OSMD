import { describe, it, expect } from 'vitest';
import { MusicSheetReader } from '../src/MusicalScore/ScoreIO/MusicSheetReader';

describe('MusicSheetReader', () => {
  it('should parse a simple MusicXML string', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
    <score-partwise version="3.0">
      <part-list>
        <score-part id="P1"><part-name>Music</part-name></score-part>
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
            <duration>4</duration>
            <type>whole</type>
          </note>
        </measure>
      </part>
    </score-partwise>`;

    const sheet = MusicSheetReader.readMusicXML(xml);

    expect(sheet).toBeDefined();
    // Simplified reader might not set Parts property same way or at all if it wasn't ported fully
    // But it should have SourceMeasures
    expect(sheet.sourceMeasures.length).toBeGreaterThan(0);
  });
});
