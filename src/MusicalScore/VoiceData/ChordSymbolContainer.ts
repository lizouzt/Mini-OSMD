import { Pitch } from "./Pitch";
import { Fraction } from "../../Common/DataObjects/Fraction";

export class ChordSymbolContainer {
    constructor(
        public root: Pitch,
        public kind: string,
        public bass: Pitch | undefined,
        public degrees: any[], // Placeholder for extensions if needed
        public timestamp: Fraction
    ) { }

    // Helper to get VexFlow friendly string (simplified)
    public toString(): string {
        // ... Logic to be implemented or used directly by Calculator
        return "";
    }
}
