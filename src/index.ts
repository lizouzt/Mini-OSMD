import { OpenSheetMusicDisplay } from "./OpenSheetMusicDisplay";

const sampleXML = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
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
      
      <!-- Staff 1: Very Low Note (Should push Staff 2 down) -->
      <note>
        <pitch><step>A</step><octave>3</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
        <staff>1</staff>
      </note>

      <backup><duration>4</duration></backup>

      <!-- Staff 2: High Note (Should bump into Staff 1 if not spaced) -->
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
        <staff>2</staff>
      </note>
    </measure>
    
    <measure number="2">
        <note>
            <pitch><step>C</step><octave>5</octave></pitch>
            <duration>4</duration>
            <type>whole</type>
            <staff>1</staff>
        </note>
        <backup><duration>4</duration></backup>
        <note>
            <pitch><step>C</step><octave>3</octave></pitch>
            <duration>4</duration>
            <type>whole</type>
            <staff>2</staff>
        </note>
    </measure>
  </part>
</score-partwise>
`;

const container = document.getElementById("osmd-container");

if (container) {

    const osmd = new OpenSheetMusicDisplay(container);

    osmd.load(sampleXML).then(() => {

        osmd.render();
        console.log("OSMD render finished");

        // Keyboard Controls
        window.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight") {
                osmd.cursor.next();
            } else if (e.key === "ArrowLeft") {
                osmd.cursor.prev();
            }
        });
        
        console.log("Press Left/Right Arrow keys to move cursor.");

    });

}