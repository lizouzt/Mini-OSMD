import * as i from "vexflow";
import Z from "jszip";
class Q {
  sourceMeasures = [];
  slurs = [];
  ties = [];
  wedges = [];
  octaveShifts = [];
  addMeasure(t) {
    this.sourceMeasures.push(t);
  }
}
var $ = /* @__PURE__ */ ((e) => (e[e.Single = 0] = "Single", e[e.Double = 1] = "Double", e[e.End = 2] = "End", e[e.RepeatEnd = 3] = "RepeatEnd", e[e.RepeatBegin = 4] = "RepeatBegin", e))($ || {}), Y = /* @__PURE__ */ ((e) => (e[e.None = 0] = "None", e[e.Start = 1] = "Start", e[e.Stop = 2] = "Stop", e[e.StartStop = 3] = "StartStop", e[e.Discontinue = 4] = "Discontinue", e))(Y || {});
class tt {
  constructor(t) {
    this.measureNumber = t;
  }
  measureNumber;
  notes = [];
  clefs = [];
  keys = [];
  rhythms = [];
  endBarType = 0;
  endingType = 0;
  endingNumber = "";
  addNote(t) {
    this.notes.push(t);
  }
}
class W {
  constructor(t = 0, r = 1) {
    this.numerator = t, this.denominator = r;
  }
  numerator;
  denominator;
  get RealValue() {
    return this.numerator / this.denominator;
  }
  static Plus(t, r) {
    return new W(
      t.numerator * r.denominator + r.numerator * t.denominator,
      t.denominator * r.denominator
    ).simplify();
  }
  simplify() {
    const t = W.gcd(this.numerator, this.denominator);
    return this.numerator /= t, this.denominator /= t, this;
  }
  static gcd(t, r) {
    return r === 0 ? t : W.gcd(r, t % r);
  }
  clone() {
    return new W(this.numerator, this.denominator);
  }
}
class et {
  pitch;
  length;
  /** The duration type string (e.g. "whole", "half", "quarter", "eighth"). */
  durationType;
  /** The voice ID (e.g. "1", "2"). Default "1". */
  voiceId;
  /** The staff ID (e.g. 1, 2). Default 1. */
  staffId;
  /** The absolute timestamp within the measure (in discrete units, e.g. 1/16th). */
  timestamp;
  slurStarts = [];
  slurEnds = [];
  tieStarts = [];
  tieEnds = [];
  tuplet;
  isGrace = !1;
  articulations = [];
  // e.g. "staccato", "accent", "fermata"
  lyrics = [];
  // Changed from single lyric
  dynamics = [];
  // e.g. "p", "f", "mf"
  constructor(t, r, l = "quarter", a = "1", d = new W(0, 1), m = 1) {
    this.pitch = t, this.length = r, this.durationType = l, this.voiceId = a, this.timestamp = d, this.staffId = m;
  }
}
var H = /* @__PURE__ */ ((e) => (e[e.C = 0] = "C", e[e.D = 2] = "D", e[e.E = 4] = "E", e[e.F = 5] = "F", e[e.G = 7] = "G", e[e.A = 9] = "A", e[e.B = 11] = "B", e))(H || {});
class st {
  constructor(t, r, l) {
    this.step = t, this.octave = r, this.alter = l;
  }
  step;
  octave;
  alter;
  get Frequency() {
    const t = this.step + this.alter + (this.octave - 4) * 12 - 9;
    return 440 * Math.pow(2, t / 12);
  }
}
var K = /* @__PURE__ */ ((e) => (e[e.G = 0] = "G", e[e.F = 1] = "F", e[e.C = 2] = "C", e[e.PERCUSSION = 3] = "PERCUSSION", e[e.TAB = 4] = "TAB", e))(K || {});
class nt {
  constructor(t, r) {
    this.clefType = t, this.line = r;
  }
  clefType;
  line;
}
class ot {
  constructor(t, r) {
    this.key = t, this.mode = r;
  }
  key;
  mode;
}
class rt {
  constructor(t, r) {
    this.numerator = t, this.denominator = r;
  }
  numerator;
  denominator;
}
class at {
  startNote;
  endNote;
}
class it {
  constructor(t, r) {
    this.actualNotes = t, this.normalNotes = r;
  }
  actualNotes;
  normalNotes;
  notes = [];
}
class ct {
  startNote;
  endNote;
}
var z = /* @__PURE__ */ ((e) => (e[e.Crescendo = 0] = "Crescendo", e[e.Diminuendo = 1] = "Diminuendo", e))(z || {});
class lt {
  constructor(t) {
    this.type = t;
  }
  type;
  startNote;
  endNote;
}
var J = /* @__PURE__ */ ((e) => (e[e.Up = 0] = "Up", e[e.Down = 1] = "Down", e))(J || {});
class ut {
  constructor(t) {
    this.type = t;
  }
  type;
  startNote;
  endNote;
}
class ht {
  static readMusicXML(t) {
    const l = new DOMParser().parseFromString(t, "text/xml"), a = new Q(), d = l.getElementsByTagName("part");
    let m = 0;
    for (let h = 0; h < d.length; h++) {
      const A = d[h].getElementsByTagName("measure");
      let C = 4, k = 1;
      const L = {}, n = {};
      let u, S, b;
      for (let E = 0; E < A.length; E++) {
        const O = A[E], U = parseInt(O.getAttribute("number") || "0");
        let x;
        a.sourceMeasures.length <= E ? (x = new tt(U), a.addMeasure(x)) : x = a.sourceMeasures[E];
        let X = new W(0, 1);
        const F = O.getElementsByTagName("attributes")[0];
        if (F) {
          const p = F.getElementsByTagName("divisions")[0];
          p && (C = parseInt(p.textContent || "4"));
          const N = F.getElementsByTagName("staves")[0];
          if (N) {
            const o = parseInt(N.textContent || "1");
            k = Math.max(k, o);
          }
          const v = F.getElementsByTagName("clef");
          for (let o = 0; o < v.length; o++) {
            const y = v[o], R = parseInt(y.getAttribute("number") || "1"), T = y.getElementsByTagName("sign")[0]?.textContent, D = parseInt(y.getElementsByTagName("line")[0]?.textContent || "0");
            let g = K.G;
            T === "F" && (g = K.F), T === "C" && (g = K.C);
            const G = m + (R - 1);
            x.clefs[G] = new nt(g, D);
          }
          const B = F.getElementsByTagName("key");
          for (let o = 0; o < B.length; o++) {
            const y = B[o], R = parseInt(y.getAttribute("number") || "1"), T = parseInt(y.getElementsByTagName("fifths")[0]?.textContent || "0"), D = y.getElementsByTagName("mode")[0]?.textContent || "major", g = m + (R - 1);
            x.keys[g] = new ot(T, D);
          }
          const V = F.getElementsByTagName("time");
          for (let o = 0; o < V.length; o++) {
            const y = V[o], R = parseInt(y.getAttribute("number") || "1"), T = parseInt(y.getElementsByTagName("beats")[0]?.textContent || "4"), D = parseInt(y.getElementsByTagName("beat-type")[0]?.textContent || "4"), g = m + (R - 1);
            x.rhythms[g] = new rt(T, D);
          }
        }
        const q = O.getElementsByTagName("barline");
        for (let p = 0; p < q.length; p++) {
          const N = q[p], v = N.getAttribute("location"), B = N.getElementsByTagName("ending")[0];
          if (B) {
            const V = B.getAttribute("number") || "", o = B.getAttribute("type") || "start";
            x.endingNumber = V, o === "start" ? x.endingType = x.endingType === Y.Stop ? Y.StartStop : Y.Start : (o === "stop" || o === "discontinue") && (x.endingType = x.endingType === Y.Start ? Y.StartStop : Y.Stop);
          }
          if (v === "right" || !v) {
            const V = N.getElementsByTagName("bar-style")[0]?.textContent, o = N.getElementsByTagName("repeat")[0];
            o && o.getAttribute("direction") === "backward" ? x.endBarType = $.RepeatEnd : V === "light-heavy" ? x.endBarType = $.End : V === "light-light" && (x.endBarType = $.Double);
          } else if (v === "left") {
            const V = N.getElementsByTagName("repeat")[0];
            V && V.getAttribute("direction") === "forward" && (x.endBarType = $.RepeatBegin);
          }
        }
        const s = O.children;
        let c = new W(0, 1), f = [];
        for (let p = 0; p < s.length; p++) {
          const N = s[p];
          if (N.tagName === "direction") {
            const v = N.getElementsByTagName("direction-type")[0];
            if (v) {
              const B = v.getElementsByTagName("dynamics")[0];
              if (B)
                for (let y = 0; y < B.children.length; y++) f.push(B.children[y].tagName);
              const V = v.getElementsByTagName("wedge")[0];
              if (V) {
                const y = V.getAttribute("type");
                y === "crescendo" || y === "diminuendo" ? (u = new lt(y === "crescendo" ? z.Crescendo : z.Diminuendo), a.wedges.push(u)) : y === "stop" && (u = void 0);
              }
              const o = v.getElementsByTagName("octave-shift")[0];
              if (o) {
                const y = o.getAttribute("type");
                y === "up" || y === "down" ? (S = new ut(y === "up" ? J.Up : J.Down), a.octaveShifts.push(S)) : y === "stop" && (S = void 0);
              }
            }
          } else if (N.tagName === "note") {
            const v = N.getElementsByTagName("chord").length > 0, B = N.getElementsByTagName("grace").length > 0;
            let V = v ? c.clone() : X.clone();
            v || (c = X.clone());
            const o = this.parseNote(N, C, V);
            if (o) {
              o.staffId += m, o.isGrace = B, f.length > 0 && !v && (o.dynamics.push(...f), f = []), u && (u.startNote || (u.startNote = o), u.endNote = o), S && (S.startNote || (S.startNote = o), S.endNote = o);
              const y = N.getElementsByTagName("notations")[0];
              if (y) {
                const T = y.getElementsByTagName("slur");
                for (let w = 0; w < T.length; w++) {
                  const P = T[w], j = parseInt(P.getAttribute("number") || "1");
                  if (P.getAttribute("type") === "start") {
                    const I = new at();
                    I.startNote = o, o.slurStarts.push(I), L[j] = I, a.slurs.push(I);
                  } else {
                    const I = L[j];
                    I && (I.endNote = o, o.slurEnds.push(I), delete L[j]);
                  }
                }
                const D = y.getElementsByTagName("tied");
                for (let w = 0; w < D.length; w++) {
                  const P = D[w], j = parseInt(P.getAttribute("number") || "1");
                  if (P.getAttribute("type") === "start") {
                    const I = new ct();
                    I.startNote = o, o.tieStarts.push(I), n[j] = I, a.ties.push(I);
                  } else {
                    const I = n[j];
                    I && (I.endNote = o, o.tieEnds.push(I), delete n[j]);
                  }
                }
                const g = y.getElementsByTagName("tuplet")[0];
                if (g) {
                  if (g.getAttribute("type") === "start") {
                    const w = N.getElementsByTagName("time-modification")[0];
                    b = new it(
                      parseInt(w?.getElementsByTagName("actual-notes")[0]?.textContent || "3"),
                      parseInt(w?.getElementsByTagName("normal-notes")[0]?.textContent || "2")
                    );
                  }
                  b && (o.tuplet = b, b.notes.push(o)), g.getAttribute("type") === "stop" && (b = void 0);
                } else b && (o.tuplet = b, b.notes.push(o));
                const G = y.getElementsByTagName("articulations")[0];
                G && (G.getElementsByTagName("staccato").length > 0 && o.articulations.push("staccato"), G.getElementsByTagName("accent").length > 0 && o.articulations.push("accent"), G.getElementsByTagName("strong-accent").length > 0 && o.articulations.push("marcato"), G.getElementsByTagName("tenuto").length > 0 && o.articulations.push("tenuto")), y.getElementsByTagName("fermata").length > 0 && o.articulations.push("fermata");
              }
              const R = N.getElementsByTagName("lyric");
              for (let T = 0; T < R.length; T++) {
                const D = R[T];
                o.lyrics.push({
                  text: D.getElementsByTagName("text")[0]?.textContent || "",
                  syllabic: D.getElementsByTagName("syllabic")[0]?.textContent || "single"
                });
              }
              !v && !B && (X = W.Plus(X, o.length)), x.addNote(o);
            }
          } else if (N.tagName === "backup") {
            const v = parseInt(N.getElementsByTagName("duration")[0]?.textContent || "0"), B = new W(v, C * 4);
            B.numerator *= -1, X = W.Plus(X, B);
          } else if (N.tagName === "forward") {
            const v = parseInt(N.getElementsByTagName("duration")[0]?.textContent || "0");
            X = W.Plus(X, new W(v, C * 4));
          }
        }
      }
      m += k;
    }
    return a;
  }
  static parseNote(t, r, l) {
    const a = t.getElementsByTagName("pitch")[0];
    if (!a) return;
    const d = H[a.getElementsByTagName("step")[0]?.textContent] || H.C, m = parseInt(a.getElementsByTagName("octave")[0]?.textContent || "4"), h = parseInt(a.getElementsByTagName("alter")[0]?.textContent || "0"), M = t.getElementsByTagName("type")[0]?.textContent || "quarter", A = t.getElementsByTagName("voice")[0]?.textContent || "1", C = parseInt(t.getElementsByTagName("staff")[0]?.textContent || "1"), k = parseInt(t.getElementsByTagName("duration")[0]?.textContent || "1");
    return new et(new st(d, m, h), new W(k, r * 4), M, A, l, C);
  }
}
class mt {
  constructor(t) {
    this.musicSheet = t;
  }
  musicSheet;
  // In a real OSMD, this would hold pages, systems, etc.
}
class _ {
  static getKeySignature(t) {
    switch (t) {
      case 0:
        return "C";
      case 1:
        return "G";
      case 2:
        return "D";
      case 3:
        return "A";
      case 4:
        return "E";
      case 5:
        return "B";
      case 6:
        return "F#";
      case 7:
        return "C#";
      case -1:
        return "F";
      case -2:
        return "Bb";
      case -3:
        return "Eb";
      case -4:
        return "Ab";
      case -5:
        return "Db";
      case -6:
        return "Gb";
      case -7:
        return "Cb";
      default:
        return "C";
    }
  }
  static format(t, r = 1e3) {
    const l = [];
    let a = [], d = 0;
    const m = t.musicSheet, h = /* @__PURE__ */ new Map(), M = ["treble", "bass"], A = ["4/4", "4/4"], C = ["C", "C"];
    let k = !1;
    for (const n of m.sourceMeasures) {
      let u = i.Volta.type.NONE;
      n.endingType === Y.Start ? (u = i.Volta.type.BEGIN, k = !0) : n.endingType === Y.Stop ? (u = i.Volta.type.END, k = !1) : n.endingType === Y.StartStop ? (u = i.Volta.type.BEGIN_END, k = !1) : k && (u = i.Volta.type.MID), n.clefs.forEach((s, c) => {
        if (s)
          switch (s.clefType) {
            case K.G:
              M[c] = "treble";
              break;
            case K.F:
              M[c] = "bass";
              break;
            case K.C:
              M[c] = "alto";
              break;
            default:
              M[c] = "treble";
          }
      }), n.rhythms.forEach((s, c) => {
        s && (A[c] = `${s.numerator}/${s.denominator}`);
      }), n.keys.forEach((s, c) => {
        s && (C[c] = _.getKeySignature(s.key));
      });
      const S = {}, b = {};
      let E = 0;
      n.notes.forEach((s) => E = Math.max(E, s.staffId - 1)), E = Math.max(E, n.clefs.length - 1);
      for (let s = 0; s <= E; s++)
        S[s] = {}, b[s] = [];
      const O = {}, U = {};
      for (const s of n.notes) {
        const c = s.staffId - 1, f = s.voiceId, p = s.timestamp.RealValue;
        O[c] || (O[c] = {}, U[c] = {}), O[c][f] || (O[c][f] = {}, U[c][f] = []), O[c][f][p] || (O[c][f][p] = [], U[c][f].push(p)), O[c][f][p].push(s);
      }
      for (let s = 0; s <= E; s++) {
        if (!O[s]) continue;
        for (const f in O[s]) {
          S[s][f] = [], U[s][f].sort((N, v) => N - v);
          let p = [];
          for (const N of U[s][f]) {
            const v = O[s][f][N];
            if (v.length === 0) continue;
            const B = v.filter((g) => !g.isGrace), V = v.filter((g) => g.isGrace);
            if (B.length === 0) {
              p.push(...V);
              continue;
            }
            const o = B[0], y = [];
            for (const g of B) {
              const G = H[g.pitch.step].toLowerCase();
              y.push(`${G}/${g.pitch.octave}`);
            }
            let R = "q";
            switch (o.durationType) {
              case "whole":
                R = "w";
                break;
              case "half":
                R = "h";
                break;
              case "quarter":
                R = "q";
                break;
              case "eighth":
                R = "8";
                break;
              case "16th":
                R = "16";
                break;
              default:
                R = "q";
            }
            const T = new i.StaveNote({
              clef: M[s] || "treble",
              keys: y,
              duration: R
            });
            T.sourceNote = o, B.forEach((g, G) => {
              if (g.pitch.alter !== 0) {
                let w = "";
                g.pitch.alter === 1 ? w = "#" : g.pitch.alter === -1 ? w = "b" : g.pitch.alter === 2 ? w = "##" : g.pitch.alter === -2 && (w = "bb"), w && T.addModifier(new i.Accidental(w), G);
              }
              g.articulations.forEach((w) => {
                let P = "";
                if (i.Modifier.Position.ABOVE, w === "staccato" ? (P = "a.", i.Modifier.Position.BELOW) : w === "accent" ? P = "a>" : w === "marcato" ? P = "a^" : w === "tenuto" ? P = "a-" : w === "fermata" && (P = "a@a"), P) {
                  const j = new i.Articulation(P);
                  T.addModifier(j, G);
                }
              }), g.dynamics && g.dynamics.length > 0 && g.dynamics.forEach((w) => {
                const P = new i.Annotation(w).setFont("Times", 12, "italic").setVerticalJustification(i.Annotation.VerticalJustify.BOTTOM);
                T.addModifier(P, G);
              });
            }), o.lyrics && o.lyrics.length > 0 && o.lyrics.forEach((g) => {
              const G = g.text + (g.syllabic === "begin" || g.syllabic === "middle" ? "-" : ""), w = new i.Annotation(G).setFont("Times", 12, "normal").setVerticalJustification(i.Annotation.VerticalJustify.BOTTOM);
              T.addModifier(w, 0);
            });
            const D = [...p, ...V];
            if (D.length > 0) {
              const g = D.map((w) => {
                const P = H[w.pitch.step].toLowerCase(), j = new i.GraceNote({
                  keys: [`${P}/${w.pitch.octave}`],
                  duration: "8",
                  slash: !0
                });
                if (w.pitch.alter !== 0) {
                  let I = "";
                  w.pitch.alter === 1 ? I = "#" : w.pitch.alter === -1 && (I = "b"), I && j.addModifier(new i.Accidental(I), 0);
                }
                return j;
              }), G = new i.GraceNoteGroup(g);
              T.addModifier(G, 0), p = [];
            }
            f === "1" ? T.setStemDirection(i.Stem.UP) : T.setStemDirection(i.Stem.DOWN), S[s][f].push(T);
            for (const g of v)
              h.set(g, T);
          }
        }
        const c = /* @__PURE__ */ new Set();
        for (const f of n.notes)
          if (f.staffId - 1 === s && f.tuplet && !c.has(f.tuplet)) {
            const p = f.tuplet, N = p.notes.map((v) => h.get(v)).filter((v, B, V) => v && V.indexOf(v) === B);
            if (N.length > 0) {
              const v = new i.Tuplet(N, {
                numNotes: p.actualNotes,
                notesOccupied: p.normalNotes
              });
              b[s].push(v);
            }
            c.add(p);
          }
      }
      let x = 150;
      for (let s = 0; s <= E; s++) {
        const c = [];
        for (const f in S[s]) {
          const p = new i.Voice({ numBeats: 4, beatValue: 4 });
          p.addTickables(S[s][f]), c.push(p);
        }
        if (c.length > 0)
          try {
            const p = new i.Formatter().joinVoices(c).preCalculateMinTotalWidth(c);
            let N = 20;
            (n.clefs[s] || n.measureNumber === 1) && (N += 40), (n.rhythms[s] || n.measureNumber === 1) && (N += 30), n.keys[s] && (N += 20), x = Math.max(x, p + N);
          } catch {
          }
      }
      const X = [];
      for (let s = 0; s <= E; s++) {
        const c = [];
        for (const f in S[s]) {
          const p = i.Beam.generateBeams(S[s][f]);
          c.push(...p);
        }
        X.push({
          vfVoices: S[s],
          beams: c,
          vfTuplets: b[s],
          clef: n.clefs[s] ? M[s] : void 0,
          keySignature: n.keys[s] || n.measureNumber === 1 ? C[s] : void 0,
          // Draw if explicit or start
          timeSignature: n.rhythms[s] ? A[s] : void 0,
          voltaType: s === 0 ? u : i.Volta.type.NONE,
          voltaNumber: s === 0 ? n.endingNumber : ""
        });
      }
      let F;
      if (n.endBarType !== void 0)
        switch (n.endBarType) {
          case $.Single:
            F = i.Barline.type.SINGLE;
            break;
          case $.Double:
            F = i.Barline.type.DOUBLE;
            break;
          case $.End:
            F = i.Barline.type.END;
            break;
          case $.RepeatEnd:
            F = i.Barline.type.REPEAT_END;
            break;
          case $.RepeatBegin:
            F = i.Barline.type.REPEAT_BEGIN;
            break;
          default:
            F = i.Barline.type.SINGLE;
        }
      const q = {
        measureNumber: n.measureNumber,
        staves: X,
        // New structure
        width: x,
        endBarLineType: F
      };
      if (d + q.width > r && a.length > 0) {
        const c = (r - d) / a.length;
        a.forEach((f) => f.width += c), l.push(a), a = [], d = 0;
      }
      a.push(q), d += q.width;
    }
    a.length > 0 && l.push(a);
    const L = [];
    for (const n of m.slurs)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), S = h.get(n.endNote);
        if (u && S) {
          const b = new i.Curve(u, S, {
            thickness: 2,
            xShift: 0,
            yShift: 10
          });
          L.push(b);
        }
      }
    for (const n of m.ties)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), S = h.get(n.endNote);
        if (u && S) {
          const b = new i.StaveTie({
            firstNote: u,
            lastNote: S,
            firstIndexes: [0],
            lastIndexes: [0]
          });
          L.push(b);
        }
      }
    for (const n of m.wedges)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), S = h.get(n.endNote);
        if (u && S) {
          const b = new i.StaveHairpin(
            { firstNote: u, lastNote: S },
            n.type === z.Crescendo ? i.StaveHairpin.type.CRESC : i.StaveHairpin.type.DECRESC
          );
          b.setPosition(i.Modifier.Position.BELOW), L.push(b);
        }
      }
    for (const n of m.octaveShifts)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), S = h.get(n.endNote);
        if (u && S) {
          const b = n.type === J.Up ? "8va" : "8vb", E = n.type === J.Up ? i.TextBracket.Position.TOP : i.TextBracket.Position.BOTTOM, O = new i.TextBracket({
            start: u,
            stop: S,
            text: b,
            position: E
          });
          L.push(O);
        }
      }
    return { systems: l, curves: L };
  }
}
class ft {
  constructor(t) {
    this.container = t, this.renderer = new i.Renderer(t, i.Renderer.Backends.SVG), this.ctx = this.renderer.getContext();
  }
  container;
  renderer;
  ctx;
  draw(t) {
    const { systems: r, curves: l } = t;
    this.ctx.clear();
    const a = 10;
    let d = a, m = 50;
    const h = /* @__PURE__ */ new Map();
    for (const M of r) {
      const A = this.calculateSystemLayout(M);
      let C = 0;
      d = a;
      for (const k of M) {
        const L = k.staves, n = [];
        if (L.forEach((u, S) => {
          const b = m + A[S], E = new i.Stave(d, b, k.width);
          if ((u.clef || d === a) && E.addClef(u.clef || "treble"), u.keySignature && E.addKeySignature(u.keySignature), u.timeSignature && E.addTimeSignature(u.timeSignature), k.endBarLineType !== void 0 && E.setEndBarType(k.endBarLineType), u.voltaType !== void 0 && u.voltaType !== i.Volta.type.NONE && E.setVoltaType(u.voltaType, u.voltaNumber || "1", 0), E.setContext(this.ctx).draw(), n.push(E), Object.keys(u.vfVoices || {}).length > 0) {
            const { voices: U, allNotes: x } = this.createVoices(u);
            new i.Formatter().joinVoices(U).format(U, k.width - 50), U.forEach((c) => c.draw(this.ctx, E));
            const X = E.getYForTopText(0) || b, q = (E.getYForBottomText(0) || b + 100) - X;
            x.forEach((c) => {
              if (c.sourceNote) {
                const f = c.sourceNote.timestamp.RealValue, p = c.getBoundingBox();
                p && (h.has(f) || h.set(f, []), h.get(f).push({
                  x: p.getX(),
                  y: X,
                  height: q
                }));
              }
            }), u.beams && u.beams.forEach((c) => c.setContext(this.ctx).draw()), u.vfTuplets && u.vfTuplets.forEach((c) => c.setContext(this.ctx).draw());
            let s = b + 100;
            x.forEach((c) => {
              const f = c.getBoundingBox();
              f && (s = Math.max(s, f.getY() + f.getH())), c.getModifiers().forEach((p) => {
                p.text_line && (s = Math.max(s, b + 140));
              });
            }), C = Math.max(C, s);
          } else
            C = Math.max(C, b + 100);
        }), n.length > 1 && d === a) {
          const u = new i.StaveConnector(n[0], n[n.length - 1]);
          u.setType(i.StaveConnector.type.BRACE), u.setContext(this.ctx).draw();
          const S = new i.StaveConnector(n[0], n[n.length - 1]);
          S.setType(i.StaveConnector.type.SINGLE_LEFT), S.setContext(this.ctx).draw();
        }
        d += k.width;
      }
      m = C + 60;
    }
    return l && l.forEach((M) => M.setContext(this.ctx).draw()), this.renderer.resize && this.renderer.resize(this.container.clientWidth, m + 100), h;
  }
  /**
   * Calculates the Y positions for each staff in a system to avoid collisions.
   */
  calculateSystemLayout(t) {
    if (t.length === 0) return [];
    const r = t[0].staves.length, l = [0];
    let a = 0;
    for (let d = 0; d < r - 1; d++) {
      let m = 100;
      for (const h of t) {
        const M = h.staves[d], A = h.staves[d + 1], C = this.measureStaffBottom(M, h.width), k = this.measureStaffTop(A, h.width), n = C - k + 40;
        m = Math.max(m, n);
      }
      a += m, l.push(a);
    }
    return l;
  }
  measureStaffBottom(t, r) {
    let l = 80;
    if (Object.keys(t.vfVoices || {}).length === 0) return l;
    const { voices: d, allNotes: m } = this.createVoices(t);
    return new i.Stave(0, 0, r), new i.Formatter().joinVoices(d).format(d, r - 50), m.forEach((h) => {
      h.keys.forEach((A, C) => {
        const L = h.getKeyProps()[C].line * 10;
        l = Math.max(l, L + 20);
      }), h.modifiers.some((A) => A.category === "annotation") && (l += 30);
    }), l;
  }
  measureStaffTop(t, r) {
    let l = 0;
    const a = Object.keys(t.vfVoices || {});
    if (a.length === 0) return l;
    const d = [];
    for (const m of a) d.push(...t.vfVoices[m]);
    return d.forEach((m) => {
      m.keys.forEach((h, M) => {
        const C = m.getKeyProps()[M].line * 10;
        l = Math.min(l, C - 20);
      });
    }), l;
  }
  createVoices(t) {
    let r = 4, l = 4;
    if (t.timeSignature) {
      const h = t.timeSignature.split("/");
      r = parseInt(h[0]), l = parseInt(h[1]);
    }
    const a = [];
    let d = [];
    const m = Object.keys(t.vfVoices || {});
    for (const h of m) {
      const M = t.vfVoices[h], A = new i.Voice({ numBeats: r, beatValue: l });
      A.setStrict(!1), A.addTickables(M), a.push(A), d.push(...M);
    }
    return { voices: a, allNotes: d };
  }
}
class dt {
  static async MXLtoXML(t) {
    const r = new Z();
    try {
      const l = await r.loadAsync(t), a = Object.keys(l.files);
      let d = "META-INF/container.xml", m = a.find((h) => h.endsWith(".xml") && !h.includes("container.xml") && !h.startsWith("__MACOSX"));
      if (m || (m = a.find((h) => h.endsWith(".musicxml") && !h.startsWith("__MACOSX"))), m)
        return await l.file(m)?.async("string") || "";
      throw new Error("No MusicXML file found in MXL.");
    } catch (l) {
      throw console.error(l), new Error("Failed to parse MXL file.");
    }
  }
}
class pt {
  constructor(t) {
    this.container = t, getComputedStyle(this.container).position === "static" && (this.container.style.position = "relative"), this.cursorElement = document.createElement("div"), this.cursorElement.style.position = "absolute", this.cursorElement.style.zIndex = "1000", this.cursorElement.style.backgroundColor = "rgba(255, 0, 0, 0.5)", this.cursorElement.style.width = "4px", this.cursorElement.style.pointerEvents = "none", this.cursorElement.style.display = "none", this.container.appendChild(this.cursorElement);
  }
  container;
  cursorElement;
  // Map<Timestamp RealValue, Position[]>
  timestampMap = /* @__PURE__ */ new Map();
  timestamps = [];
  currentIndex = 0;
  init(t) {
    this.timestampMap = t, this.timestamps = Array.from(t.keys()).sort((r, l) => r - l), this.currentIndex = 0, this.hide();
  }
  show() {
    this.cursorElement.style.display = "block", this.update();
  }
  hide() {
    this.cursorElement.style.display = "none";
  }
  next() {
    this.currentIndex < this.timestamps.length - 1 && (this.currentIndex++, this.update());
  }
  prev() {
    this.currentIndex > 0 && (this.currentIndex--, this.update());
  }
  reset() {
    this.currentIndex = 0, this.update();
  }
  update() {
    if (this.timestamps.length === 0) return;
    const t = this.timestamps[this.currentIndex], r = this.timestampMap.get(t);
    if (r && r.length > 0) {
      let l = r[0].y, a = r[0].y + r[0].height, d = r[0].x;
      r.forEach((m) => {
        l = Math.min(l, m.y), a = Math.max(a, m.y + m.height), d = Math.min(d, m.x);
      }), this.cursorElement.style.left = `${d}px`, this.cursorElement.style.top = `${l}px`, this.cursorElement.style.height = `${a - l}px`;
    }
  }
}
class yt {
  constructor(t) {
    if (typeof t == "string") {
      const r = document.getElementById(t);
      if (!r) throw new Error("Container element not found");
      this.container = r;
    } else
      this.container = t;
    this.drawer = new ft(this.container), this.cursor = new pt(this.container);
  }
  container;
  drawer;
  sheet;
  graphicalSheet;
  cursor;
  /**
   * Load a MusicXML file string or MXL ArrayBuffer.
   * @param content The MusicXML string or MXL buffer
   */
  async load(t) {
    return new Promise(async (r, l) => {
      try {
        let a = "";
        typeof t == "string" ? (t.startsWith("PK"), a = t) : a = await dt.MXLtoXML(t), this.sheet = ht.readMusicXML(a), r();
      } catch (a) {
        l(a);
      }
    });
  }
  /**
   * Render the loaded sheet music.
   */
  render() {
    if (!this.sheet) {
      console.warn("No sheet loaded. Call load() first.");
      return;
    }
    this.graphicalSheet = new mt(this.sheet);
    const t = this.container.clientWidth || 1e3, r = _.format(this.graphicalSheet, t), l = this.drawer.draw(r);
    this.cursor.init(l), this.cursor.show();
  }
}
export {
  Q as MusicSheet,
  yt as OpenSheetMusicDisplay,
  ft as VexFlowMusicSheetDrawer
};
