import JSZip from "jszip";

export class MXLHelper {
    public static async MXLtoXML(data: string | ArrayBuffer | Uint8Array): Promise<string> {
        const zip = new JSZip();
        try {
            const loadedZip = await zip.loadAsync(data);
            
            // Find container.xml to locate the rootfile
            // But simpler: just find the first .xml file that isn't container.xml
            const files = Object.keys(loadedZip.files);
            let rootFile = "META-INF/container.xml";
            
            // Try to read container.xml to find rootfile path
            // (Standard MusicXML structure)
            
            // For MVP, just search for .xml
            let musicXMLFile = files.find(f => f.endsWith(".xml") && !f.includes("container.xml") && !f.startsWith("__MACOSX"));
            
            if (!musicXMLFile) {
                // Fallback: look for .musicxml
                musicXMLFile = files.find(f => f.endsWith(".musicxml") && !f.startsWith("__MACOSX"));
            }

            if (musicXMLFile) {
                return await loadedZip.file(musicXMLFile)?.async("string") || "";
            } else {
                throw new Error("No MusicXML file found in MXL.");
            }
        } catch (e) {
            console.error(e);
            throw new Error("Failed to parse MXL file.");
        }
    }
}
