import { OpenSheetMusicDisplay } from "./OpenSheetMusicDisplay";

const sampleXML = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>3</divisions>
        <key>
          <fifths>1</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction placement="below">
        <direction-type>
          <dynamics>
            <p/>
          </dynamics>
        </direction-type>
      </direction>
      <!-- Triplet: 3 eighth notes in the space of 2 -->
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>2</duration>
        <type>eighth</type>
        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>
        <notations>
          <tuplet type="start" bracket="yes"/>
        </notations>
        <lyric>
          <syllabic>begin</syllabic>
          <text>Hel</text>
        </lyric>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>2</duration>
        <type>eighth</type>
        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>
        <lyric>
          <syllabic>end</syllabic>
          <text>lo</text>
        </lyric>
      </note>
      <direction placement="below">
        <direction-type>
          <wedge type="crescendo"/>
        </direction-type>
      </direction>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>2</duration>
        <type>eighth</type>
        <time-modification>
          <actual-notes>3</actual-notes>
          <normal-notes>2</normal-notes>
        </time-modification>
        <notations>
          <tuplet type="stop"/>
        </notations>
        <lyric>
          <syllabic>single</syllabic>
          <text>World</text>
        </lyric>
      </note>
      <direction placement="below">
        <direction-type>
          <wedge type="stop"/>
        </direction-type>
      </direction>
      
      <!-- Normal notes to fill the measure -->
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>3</duration>
        <type>quarter</type>
        <notations>
          <tied type="start"/>
        </notations>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>3</duration>
        <type>quarter</type>
        <notations>
          <tied type="stop"/>
        </notations>
      </note>
    </measure>
    <!-- Measure 2 -->
    <measure number="2">
      <direction placement="above">
        <direction-type>
          <octave-shift type="up" size="8"/>
        </direction-type>
      </direction>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <direction>
        <direction-type>
          <octave-shift type="stop" size="8"/>
        </direction-type>
      </direction>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
    <!-- Measure 3 -->
    <measure number="3">
      <note>
        <grace/>
        <pitch><step>B</step><octave>4</octave></pitch>
        <voice>1</voice>
        <type>eighth</type>
      </note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>6</duration><type>half</type></note>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>6</duration><type>half</type></note>
    </measure>
    <!-- Measure 4 -->
    <measure number="4">
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
    <!-- Measure 5: Multi-voice test with Backup -->
    <measure number="5">
      <!-- Voice 1 -->
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <voice>1</voice>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <voice>1</voice>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <voice>1</voice>
      </note>
      <note>
        <pitch><step>F</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <voice>1</voice>
      </note>
      
      <!-- Go back to start of measure -->
      <backup>
        <duration>4</duration>
      </backup>
      
      <!-- Voice 2 -->
      <note>
        <pitch><step>A</step><octave>4</octave></pitch>
        <duration>2</duration>
        <type>half</type>
        <voice>2</voice>
      </note>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>2</duration>
        <type>half</type>
        <voice>2</voice>
      </note>
    </measure>
    <!-- Measure 7: Grand Staff Piano -->
    <measure number="7">
      <attributes>
        <divisions>1</divisions>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>
      
      <!-- Staff 1: Right Hand -->
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>2</duration>
        <type>half</type>
        <staff>1</staff>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>2</duration>
        <type>half</type>
        <staff>1</staff>
      </note>
      
      <!-- Staff 2: Left Hand (Simultaneous) -->
      <!-- Since we use cursor logic, we need to backup or interleave. 
           But wait, our cursor logic tracks a SINGLE global cursor.
           If we write Staff 1 notes, cursor advances to 4.
           Then we write Staff 2 notes. They will start at 4!
           This is WRONG for mult-staff.
           
           Solution: Use <backup> to rewind for Staff 2.
      -->
      <backup><duration>4</duration></backup>
      
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
        <staff>2</staff>
      </note>
      <barline location="right">
        <bar-style>light-heavy</bar-style>
        <repeat direction="backward"/>
      </barline>
    </measure>
    
    <!-- Measure 8: Articulations & Low Notes for Spacing -->
    <measure number="8">
      <note>
        <pitch><step>C</step><octave>3</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations>
          <articulations>
            <staccato/>
            <accent/>
          </articulations>
        </notations>
      </note>
      <!-- Very low note -->
      <note>
        <pitch><step>A</step><octave>2</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations>
          <fermata/>
        </notations>
      </note>
    </measure>
  </part>
</score-partwise>
`;

const container = document.getElementById("osmd-container");

if (container) {

    const osmd = new OpenSheetMusicDisplay(container);

    // osmd.load is now async

    osmd.load(sampleXML).then(() => {

        osmd.render();

        console.log("OSMD render finished");

    });

}
