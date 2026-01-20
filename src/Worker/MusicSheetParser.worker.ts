import { MusicSheetReader } from "../MusicalScore/ScoreIO/MusicSheetReader";
import { MusicSheet } from "../MusicalScore/MusicSheet";
import { DOMParser } from "@xmldom/xmldom";

// Polyfill DOMParser for Worker environment
if (!self.DOMParser) {
    (self as any).DOMParser = DOMParser;
}

// Explicit type for the message event
interface ParseMessage {
    xml: string;
}

self.onmessage = (e: MessageEvent<ParseMessage>) => {
    const { xml } = e.data;
    try {
        console.log("Worker: Basic parsing started...");
        const sheet = MusicSheetReader.readMusicXML(xml);
        console.log("Worker: Parsing complete. Returning data.");

        // We cannot just pass 'sheet' because methods will be stripped.
        // We pass the plain object structure.
        // Note: structuredClone or postMessage default cloning algorithm handles cyclic references, 
        // which MusicSheet has (Measure -> Note -> Measure).
        // So we can send it directly.
        self.postMessage({ success: true, data: sheet });
    } catch (err: any) {
        self.postMessage({ success: false, error: err.message });
    }
};
