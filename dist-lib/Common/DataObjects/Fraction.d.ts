export declare class Fraction {
    constructor(numerator?: number, denominator?: number);
    numerator: number;
    denominator: number;
    get RealValue(): number;
    static Plus(f1: Fraction, f2: Fraction): Fraction;
    simplify(): Fraction;
    private static gcd;
    clone(): Fraction;
}
