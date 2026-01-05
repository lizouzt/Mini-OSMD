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
    expect(sheet.sourceMeasures.length).toBeGreaterThan(0);
  });

  it('should have increasing timestamps across measures', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
        <measure number="2">
          <note>
            <pitch><step>D</step><octave>4</octave></pitch>
            <duration>4</duration>
            <type>whole</type>
          </note>
        </measure>
      </part>
    </score-partwise>`;

    const sheet = MusicSheetReader.readMusicXML(xml);

    expect(sheet.sourceMeasures.length).toBe(2);
    
    const m1 = sheet.sourceMeasures[0];
    const m2 = sheet.sourceMeasures[1];

    expect(m1.notes.length).toBe(1);
    expect(m2.notes.length).toBe(1);

    const n1 = m1.notes[0];
    const n2 = m2.notes[0];

    // Divisions=1, Duration=4 => 4 beats = 1 Whole Note (4/4)
    // Fraction logic: 4 / (1*4) = 1/1. 
    // Wait, Note constructor: new Fraction(dur, divisions * 4)
    // If divisions=1, dur=4. Fraction = 4/4 = 1.
    
    // Note 1: ts=0.
    // Note 2: ts=1.
    
    expect(n1.timestamp.RealValue).toBe(0);
    expect(n2.timestamp.RealValue).toBe(1);
    expect(n2.timestamp.RealValue).toBeGreaterThan(n1.timestamp.RealValue);
  });
});