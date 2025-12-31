export class Fraction {
    constructor(numerator: number = 0, denominator: number = 1) {
        this.numerator = numerator;
        this.denominator = denominator;
    }

    public numerator: number;
    public denominator: number;

    public get RealValue(): number {
        return this.numerator / this.denominator;
    }

    public static Plus(f1: Fraction, f2: Fraction): Fraction {
        return new Fraction(
            f1.numerator * f2.denominator + f2.numerator * f1.denominator,
            f1.denominator * f2.denominator
        ).simplify();
    }

    public simplify(): Fraction {
        const common = Fraction.gcd(this.numerator, this.denominator);
        this.numerator /= common;
        this.denominator /= common;
        return this;
    }

    private static gcd(a: number, b: number): number {
        return b === 0 ? a : Fraction.gcd(b, a % b);
    }

    public clone(): Fraction {
        return new Fraction(this.numerator, this.denominator);
    }
}
