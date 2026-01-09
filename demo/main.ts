import { OpenSheetMusicDisplay, CursorType } from "../src/index";
// @ts-ignore
import beethovenUrl from '/demo/Beethoven_AnDieFerneGeliebte.xml?url';
// @ts-ignore
import brahmsUrl from '/demo/BrahWiMeSample.musicxml?url';
// @ts-ignore
import debussyUrl from '/demo/Debussy_Mandoline.xml?url';
// @ts-ignore
import dichterliebeUrl from '/demo/Dichterliebe01.xml?url';
// @ts-ignore
import parlezUrl from '/demo/Parlez-moi.mxl?url';
// @ts-ignore
import saltarelloUrl from '/demo/Saltarello.mxl?url';
// @ts-ignore
import multirestUrl from '/demo/Test_Auto_Multirest_2.musicxml?url';
// @ts-ignore
import slursUrl from '/demo/test_slurs_highNotes.musicxml?url';
// @ts-ignore
import functionTestUrl from '/demo/OSMD_function_test_all.xml?url';

const builtInXML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
  <part-list>
    <score-part id="P1"><part-name>Violin</part-name></score-part>
    <score-part id="P2"><part-name>Piano</part-name></score-part>
  </part-list>
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
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations><tuplet type="start"/></notations></note>
      <note><pitch><step>F</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification></note>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><type>eighth</type><time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification><notations><tuplet type="stop"/><slur type="stop" number="1"/></notations></note>
      <note><rest/><duration>1</duration><type>eighth</type></note>
    </measure>
    <measure number="2">
      <barline location="left"><ending number="1" type="start"/></barline>
      <note><pitch><step>C</step><octave>6</octave></pitch><duration>8</duration><type>whole</type></note>
      <barline location="right"><ending number="1" type="stop"/><repeat direction="backward"/></barline>
    </measure>
    <measure number="3">
      <barline location="left"><ending number="2" type="start"/></barline>
      <note><pitch><step>E</step><octave>6</octave></pitch><duration>8</duration><type>whole</type></note>
      <barline location="right"><ending number="2" type="discontinue"/></barline>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <staves>2</staves>
        <clef number="1"><sign>G</sign><line>2</line></clef>
        <clef number="2"><sign>F</sign><line>4</line></clef>
      </attributes>
      <note><pitch><step>A</step><octave>3</octave></pitch><duration>8</duration><type>whole</type><staff>1</staff></note>
      <backup><duration>8</duration></backup>
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
const selectElement = document.getElementById("score-selector") as HTMLSelectElement;
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");
const zoomLevelSpan = document.getElementById("zoom-level");
const cursorPrevBtn = document.getElementById("cursor-prev-btn");
const cursorNextBtn = document.getElementById("cursor-next-btn");
const cursorPlayBtn = document.getElementById("cursor-play-btn");
const cursorShowBtn = document.getElementById("cursor-show-btn");
const cursorTypeSelector = document.getElementById("cursor-type-selector") as HTMLSelectElement;
const darkModeBtn = document.getElementById("dark-mode-btn");
const fileUpload = document.getElementById("file-upload") as HTMLInputElement;

if (container && selectElement) {
    const osmd = new OpenSheetMusicDisplay(container);
    let currentZoom = 1.0;
    let isDarkMode = false;
    let playInterval: any = null;

    const scores = [
        { name: "Built-in Test (Ultimate)", value: "builtin", url: "" },
        { name: "Beethoven: An die ferne Geliebte", value: "beethoven", url: beethovenUrl },
        { name: "Brahms: Wie Melodien zieht es mir", value: "brahms", url: brahmsUrl },
        { name: "Debussy: Mandoline", value: "debussy", url: debussyUrl },
        { name: "Schumann: Dichterliebe 01", value: "dichterliebe", url: dichterliebeUrl },
        { name: "Parlez-moi", value: "parlez", url: parlezUrl },
        { name: "Saltarello", value: "saltarello", url: saltarelloUrl },
        { name: "Test Auto Multirest", value: "multirest", url: multirestUrl },
        { name: "Test Slurs High Notes", value: "slurs", url: slursUrl },
        { name: "OSMD Function Test All", value: "function_test", url: functionTestUrl }
    ];

    scores.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.value;
        opt.innerText = s.name;
        selectElement.appendChild(opt);
    });

    const loadScore = async (value: string) => {
        try {
            // Stop playing if new score loads
            if (playInterval) togglePlay();

            // Reset Zoom
            currentZoom = 1.0;
            updateZoom();
            // container.innerHTML = ""; // DO NOT CLEAR: Destroys Renderer/Cursor

            console.log(`Loading: ${value}`);
            let xmlContent = "";
            
            if (value === "builtin") {
                xmlContent = builtInXML;
            } else {
                const score = scores.find(s => s.value === value);
                if (score && score.url) {
                   // In dev, url is file path. In prod, might need fetch.
                   // Vite ?url import returns the URL string.
                   const response = await fetch(score.url);
                   if (!response.ok) throw new Error(`Failed to fetch ${score.url}`);
                   xmlContent = await response.text();
                }
            }
            
            await osmd.load(xmlContent);
            osmd.render();
        } catch (e) {
            console.error("Error loading score:", e);
        }
    };

    const updateZoom = () => {
        osmd.zoom = currentZoom; // Sync zoom to OSMD
        console.log(`Zoom set to ${currentZoom}`);
        if (zoomLevelSpan) zoomLevelSpan.innerText = `${Math.round(currentZoom * 100)}%`;
        // Internal rendering handles scaling now.
    };

    const togglePlay = () => {
        if (playInterval) {
            clearInterval(playInterval);
            playInterval = null;
            if (cursorPlayBtn) cursorPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;
        } else {
            playInterval = setInterval(() => {
                osmd.cursor.next();
            }, 200); // 200ms per step
            if (cursorPlayBtn) cursorPlayBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        }
    };

    const toggleDarkMode = () => {
        isDarkMode = !isDarkMode;
        osmd.setDarkMode(isDarkMode);
        document.body.classList.toggle("dark-mode", isDarkMode);
    };

    // Events
    selectElement.addEventListener("change", (e) => {
        const target = e.target as HTMLSelectElement;
        loadScore(target.value);
    });

    if (fileUpload) {
        fileUpload.addEventListener("change", async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const file = files[0];
                console.log("File selected:", file.name);
                
                try {
                    // Stop playing
                    if (playInterval) togglePlay();

                    currentZoom = 1.0;
                    updateZoom();

                    const extension = file.name.split('.').pop()?.toLowerCase();
                    let content: string | ArrayBuffer;

                    if (extension === 'mxl') {
                        content = await file.arrayBuffer();
                    } else {
                        content = await file.text();
                    }

                    await osmd.load(content);
                    osmd.render();
                    
                    // Reset selector to allow re-selecting same built-in if needed
                    selectElement.value = ""; 
                } catch (e) {
                    console.error("Error loading file:", e);
                    alert("Error loading file: " + e);
                }
            }
        });
    }

    zoomInBtn?.addEventListener("click", () => {
        currentZoom += 0.1;
        updateZoom();
    });

    zoomOutBtn?.addEventListener("click", () => {
        currentZoom = Math.max(0.1, currentZoom - 0.1);
        updateZoom();
    });

    cursorNextBtn?.addEventListener("click", () => osmd.cursor.next());
    cursorPrevBtn?.addEventListener("click", () => osmd.cursor.prev());
    cursorPlayBtn?.addEventListener("click", togglePlay);
    
    cursorShowBtn?.addEventListener("click", () => {
        if (osmd.cursor.hidden) {
            osmd.cursor.show();
            cursorShowBtn.innerText = "Hide Cursor";
        } else {
            osmd.cursor.hide();
            cursorShowBtn.innerText = "Show Cursor";
        }
    });

    if (cursorTypeSelector) {
        cursorTypeSelector.value = "1"; // Default to Cover Notes (CurrentArea)
        cursorTypeSelector.addEventListener("change", (e) => {
            const val = parseInt((e.target as HTMLSelectElement).value);
            osmd.setCursorOptions({ type: val as CursorType });
        });
    }

    darkModeBtn?.addEventListener("click", toggleDarkMode);

    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") osmd.cursor.next();
        if (e.key === "ArrowLeft") osmd.cursor.prev();
        if (e.key === " ") { 
             e.preventDefault();
             togglePlay(); 
        }
    });

    // Initial load
    loadScore("builtin");
}