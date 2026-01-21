import { Pitch } from './Pitch';
import { Fraction } from '../../Common/DataObjects/Fraction';
export declare class ChordSymbolContainer {
    root: Pitch;
    kind: string;
    bass: Pitch | undefined;
    degrees: any[];
    timestamp: Fraction;
    constructor(root: Pitch, kind: string, bass: Pitch | undefined, degrees: any[], // Placeholder for extensions if needed
    timestamp: Fraction);
    toString(): string;
}
