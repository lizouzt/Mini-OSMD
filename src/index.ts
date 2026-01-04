import { OpenSheetMusicDisplay } from "./OpenSheetMusicDisplay";

const sampleXML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
  <part-list>
    <score-part id="P1"><part-name>Violin</part-name></score-part>
    <score-part id="P2"><part-name>Piano</part-name></score-part>
  </part-list>
  
  <!-- Part 1: Violin (Melody + Lyrics + Dynamics) -->
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <direction placement="below"><direction-type><dynamics><mf/></dynamics></direction-type></direction>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type>
        <lyric><text>Verse1</text></lyric>
        <lyric><text>Verse2</text></lyric>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><type>quarter</type>
        <notations><slur type="start" number="1"/></notations>
      </note>
      <!-- Tuplet -->
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations><tuplet type="start"/></notations></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations><tuplet type="stop"/><slur type="stop" number="1"/></notations></note>
      <note><rest/><duration>1</duration><type>eighth</type></note>
    </measure>
    
    <!-- Measure 2: Volta 1 -->
    <measure number="2">
      <barline location="left"><ending number="1" type="start"/></barline>
      <note><pitch><step>C</step><octave>6</octave></pitch><duration>8</duration><type>whole</type></note>
      <barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline>
    </measure>
    
    <!-- Measure 3: Volta 2 -->
    <measure number="3">
      <barline location="left"><ending number="2" type="start"/></barline>
      <note><pitch><step>E</step><octave>6</octave></pitch><duration>8</duration><type>whole</type></note>
      <barline location="right"><ending number="2" type="discontinue"/></barline>
    </measure>
  </part>

  <!-- Part 2: Piano (Grand Staff + Collision Test) -->
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <!-- Staff 1: Low note to test collision with Staff 2 -->
      <note><pitch><step>A</step><octave>3</octave></pitch><duration>8</duration><type>whole</type><staff>1</staff></note>
      <backup><duration>8</duration></backup>
      <!-- Staff 2: High note to test collision with Staff 1 -->
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>8</duration><type>whole</type><staff>2</staff></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>8</duration><type>whole</type><staff>1</staff></note>
      <backup><duration>8</duration></backup>
      <note><pitch><step>G</step><octave>2</octave></pitch><duration>8</duration><type>whole</type><staff>2</staff></note>
    </measure>
    <measure number="3">
       <note><pitch><step>C</step><octave>5</octave></pitch><duration>8</duration><type>whole</type><staff>1</staff></note>
       <backup><duration>8</duration></backup>
       <note><pitch><step>C</step><octave>3</octave></pitch><duration>8</duration><type>whole</type><staff>2</staff></note>
    </measure>
  </part>
</score-partwise>`;

const container = document.getElementById("osmd-container");

if (container) {
  const osmd = new OpenSheetMusicDisplay(container);

  console.log("Loading Ultimate Test Score...");

  osmd.load(sampleXML).then(() => {
    try {
      osmd.render();
      console.log("OSMD render finished. Use Left/Right Arrow keys to move cursor.");
    } catch (e) {
      console.error("Error during rendering:", e);
    }
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
            osmd.cursor.next();
        } else if (e.key === "ArrowLeft") {
            osmd.cursor.prev();
        }
    });
  });
}
