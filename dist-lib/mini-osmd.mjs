import * as a from "vexflow";
import Q from "jszip";
class tt {
  sourceMeasures = [];
  slurs = [];
  ties = [];
  wedges = [];
  octaveShifts = [];
  addMeasure(t) {
    this.sourceMeasures.push(t);
  }
}
var Y = /* @__PURE__ */ ((e) => (e[e.Single = 0] = "Single", e[e.Double = 1] = "Double", e[e.End = 2] = "End", e[e.RepeatEnd = 3] = "RepeatEnd", e[e.RepeatBegin = 4] = "RepeatBegin", e))(Y || {}), U = /* @__PURE__ */ ((e) => (e[e.None = 0] = "None", e[e.Start = 1] = "Start", e[e.Stop = 2] = "Stop", e[e.StartStop = 3] = "StartStop", e[e.Discontinue = 4] = "Discontinue", e))(U || {});
class et {
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
class st {
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
  isRest = !1;
  articulations = [];
  // e.g. "staccato", "accent", "fermata"
  lyrics = [];
  // Changed from single lyric
  dynamics = [];
  // e.g. "p", "f", "mf"
  constructor(t, r, l = "quarter", i = "1", d = new W(0, 1), m = 1) {
    this.pitch = t, this.length = r, this.durationType = l, this.voiceId = i, this.timestamp = d, this.staffId = m;
  }
}
var H = /* @__PURE__ */ ((e) => (e[e.C = 0] = "C", e[e.D = 2] = "D", e[e.E = 4] = "E", e[e.F = 5] = "F", e[e.G = 7] = "G", e[e.A = 9] = "A", e[e.B = 11] = "B", e))(H || {});
class Z {
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
    const l = new DOMParser().parseFromString(t, "text/xml"), i = new tt(), d = l.getElementsByTagName("part");
    let m = 0;
    for (let h = 0; h < d.length; h++) {
      const I = d[h].getElementsByTagName("measure");
      let B = 4, V = 1;
      const R = {}, n = {};
      let u, N, E, b = new W(0, 1);
      for (let O = 0; O < I.length; O++) {
        const X = I[O], $ = parseInt(X.getAttribute("number") || "0");
        let C;
        i.sourceMeasures.length <= O ? (C = new et($), i.addMeasure(C)) : C = i.sourceMeasures[O];
        const L = X.getElementsByTagName("attributes")[0];
        if (L) {
          const p = L.getElementsByTagName("divisions")[0];
          p && (B = parseInt(p.textContent || "4"));
          const v = L.getElementsByTagName("staves")[0];
          if (v) {
            const o = parseInt(v.textContent || "1");
            V = Math.max(V, o);
          }
          const w = L.getElementsByTagName("clef");
          for (let o = 0; o < w.length; o++) {
            const g = w[o], G = parseInt(g.getAttribute("number") || "1"), T = g.getElementsByTagName("sign")[0]?.textContent, D = parseInt(g.getElementsByTagName("line")[0]?.textContent || "0");
            let y = K.G;
            T === "F" && (y = K.F), T === "C" && (y = K.C);
            const P = m + (G - 1);
            C.clefs[P] = new nt(y, D);
          }
          const x = L.getElementsByTagName("key");
          for (let o = 0; o < x.length; o++) {
            const g = x[o], G = parseInt(g.getAttribute("number") || "1"), T = parseInt(g.getElementsByTagName("fifths")[0]?.textContent || "0"), D = g.getElementsByTagName("mode")[0]?.textContent || "major", y = m + (G - 1);
            C.keys[y] = new ot(T, D);
          }
          const A = L.getElementsByTagName("time");
          for (let o = 0; o < A.length; o++) {
            const g = A[o], G = parseInt(g.getAttribute("number") || "1"), T = parseInt(g.getElementsByTagName("beats")[0]?.textContent || "4"), D = parseInt(g.getElementsByTagName("beat-type")[0]?.textContent || "4"), y = m + (G - 1);
            C.rhythms[y] = new rt(T, D);
          }
        }
        const q = X.getElementsByTagName("barline");
        for (let p = 0; p < q.length; p++) {
          const v = q[p], w = v.getAttribute("location"), x = v.getElementsByTagName("ending")[0];
          if (x) {
            const A = x.getAttribute("number") || "", o = x.getAttribute("type") || "start";
            C.endingNumber = A, o === "start" ? C.endingType = C.endingType === U.Stop ? U.StartStop : U.Start : (o === "stop" || o === "discontinue") && (C.endingType = C.endingType === U.Start ? U.StartStop : U.Stop);
          }
          if (w === "right" || !w) {
            const A = v.getElementsByTagName("bar-style")[0]?.textContent, o = v.getElementsByTagName("repeat")[0];
            o && o.getAttribute("direction") === "backward" ? C.endBarType = Y.RepeatEnd : A === "light-heavy" ? C.endBarType = Y.End : A === "light-light" && (C.endBarType = Y.Double);
          } else if (w === "left") {
            const A = v.getElementsByTagName("repeat")[0];
            A && A.getAttribute("direction") === "forward" && (C.endBarType = Y.RepeatBegin);
          }
        }
        const s = X.children;
        let c = new W(0, 1), f = [];
        for (let p = 0; p < s.length; p++) {
          const v = s[p];
          if (v.tagName === "direction") {
            const w = v.getElementsByTagName("direction-type")[0];
            if (w) {
              const x = w.getElementsByTagName("dynamics")[0];
              if (x)
                for (let g = 0; g < x.children.length; g++) f.push(x.children[g].tagName);
              const A = w.getElementsByTagName("wedge")[0];
              if (A) {
                const g = A.getAttribute("type");
                g === "crescendo" || g === "diminuendo" ? (u = new lt(g === "crescendo" ? z.Crescendo : z.Diminuendo), i.wedges.push(u)) : g === "stop" && (u = void 0);
              }
              const o = w.getElementsByTagName("octave-shift")[0];
              if (o) {
                const g = o.getAttribute("type");
                g === "up" || g === "down" ? (N = new ut(g === "up" ? J.Up : J.Down), i.octaveShifts.push(N)) : g === "stop" && (N = void 0);
              }
            }
          } else if (v.tagName === "note") {
            const w = v.getElementsByTagName("chord").length > 0, x = v.getElementsByTagName("grace").length > 0;
            let A = w ? c.clone() : b.clone();
            w || (c = b.clone());
            const o = this.parseNote(v, B, A);
            if (o) {
              o.staffId += m, o.isGrace = x, f.length > 0 && !w && (o.dynamics.push(...f), f = []), u && (u.startNote || (u.startNote = o), u.endNote = o), N && (N.startNote || (N.startNote = o), N.endNote = o);
              const g = v.getElementsByTagName("notations")[0];
              if (g) {
                const T = g.getElementsByTagName("slur");
                for (let S = 0; S < T.length; S++) {
                  const F = T[S], j = parseInt(F.getAttribute("number") || "1");
                  if (F.getAttribute("type") === "start") {
                    const k = new at();
                    k.startNote = o, o.slurStarts.push(k), R[j] = k, i.slurs.push(k);
                  } else {
                    const k = R[j];
                    k && (k.endNote = o, o.slurEnds.push(k), delete R[j]);
                  }
                }
                const D = g.getElementsByTagName("tied");
                for (let S = 0; S < D.length; S++) {
                  const F = D[S], j = parseInt(F.getAttribute("number") || "1");
                  if (F.getAttribute("type") === "start") {
                    const k = new ct();
                    k.startNote = o, o.tieStarts.push(k), n[j] = k, i.ties.push(k);
                  } else {
                    const k = n[j];
                    k && (k.endNote = o, o.tieEnds.push(k), delete n[j]);
                  }
                }
                const y = g.getElementsByTagName("tuplet")[0];
                if (y) {
                  if (y.getAttribute("type") === "start") {
                    const S = v.getElementsByTagName("time-modification")[0];
                    E = new it(
                      parseInt(S?.getElementsByTagName("actual-notes")[0]?.textContent || "3"),
                      parseInt(S?.getElementsByTagName("normal-notes")[0]?.textContent || "2")
                    );
                  }
                  E && (o.tuplet = E, E.notes.push(o)), y.getAttribute("type") === "stop" && (E = void 0);
                } else E && (o.tuplet = E, E.notes.push(o));
                const P = g.getElementsByTagName("articulations")[0];
                P && (P.getElementsByTagName("staccato").length > 0 && o.articulations.push("staccato"), P.getElementsByTagName("accent").length > 0 && o.articulations.push("accent"), P.getElementsByTagName("strong-accent").length > 0 && o.articulations.push("marcato"), P.getElementsByTagName("tenuto").length > 0 && o.articulations.push("tenuto")), g.getElementsByTagName("fermata").length > 0 && o.articulations.push("fermata");
              }
              const G = v.getElementsByTagName("lyric");
              for (let T = 0; T < G.length; T++) {
                const D = G[T];
                o.lyrics.push({
                  text: D.getElementsByTagName("text")[0]?.textContent || "",
                  syllabic: D.getElementsByTagName("syllabic")[0]?.textContent || "single"
                });
              }
              !w && !x && (b = W.Plus(b, o.length)), C.addNote(o);
            }
          } else if (v.tagName === "backup") {
            const w = parseInt(v.getElementsByTagName("duration")[0]?.textContent || "0"), x = new W(w, B * 4);
            x.numerator *= -1, b = W.Plus(b, x);
          } else if (v.tagName === "forward") {
            const w = parseInt(v.getElementsByTagName("duration")[0]?.textContent || "0");
            b = W.Plus(b, new W(w, B * 4));
          }
        }
      }
      m += V;
    }
    return i;
  }
  static parseNote(t, r, l) {
    const i = t.getElementsByTagName("type")[0]?.textContent || "quarter", d = t.getElementsByTagName("voice")[0]?.textContent || "1", m = parseInt(t.getElementsByTagName("staff")[0]?.textContent || "1"), h = parseInt(t.getElementsByTagName("duration")[0]?.textContent || "1"), M = t.getElementsByTagName("rest")[0], I = t.getElementsByTagName("pitch")[0];
    let B, V = !1;
    if (M)
      V = !0, B = new Z(H.B, 4, 0);
    else if (I) {
      const n = H[I.getElementsByTagName("step")[0]?.textContent] || H.C, u = parseInt(I.getElementsByTagName("octave")[0]?.textContent || "4"), N = parseInt(I.getElementsByTagName("alter")[0]?.textContent || "0");
      B = new Z(n, u, N);
    } else
      return;
    const R = new st(B, new W(h, r * 4), i, d, l, m);
    return R.isRest = V, R;
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
    let i = [], d = 0;
    const m = t.musicSheet, h = /* @__PURE__ */ new Map(), M = ["treble", "bass"], I = ["4/4", "4/4"], B = ["C", "C"];
    let V = !1;
    for (const n of m.sourceMeasures) {
      let u = a.Volta.type.NONE;
      n.endingType === U.Start ? (u = a.Volta.type.BEGIN, V = !0) : n.endingType === U.Stop ? (u = a.Volta.type.END, V = !1) : n.endingType === U.StartStop ? (u = a.Volta.type.BEGIN_END, V = !1) : V && (u = a.Volta.type.MID), n.clefs.forEach((s, c) => {
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
        s && (I[c] = `${s.numerator}/${s.denominator}`);
      }), n.keys.forEach((s, c) => {
        s && (B[c] = _.getKeySignature(s.key));
      });
      const N = {}, E = {};
      let b = 0;
      n.notes.forEach((s) => b = Math.max(b, s.staffId - 1)), b = Math.max(b, n.clefs.length - 1);
      for (let s = 0; s <= b; s++)
        N[s] = {}, E[s] = [];
      const O = {}, X = {};
      for (const s of n.notes) {
        const c = s.staffId - 1, f = s.voiceId, p = s.timestamp.RealValue;
        O[c] || (O[c] = {}, X[c] = {}), O[c][f] || (O[c][f] = {}, X[c][f] = []), O[c][f][p] || (O[c][f][p] = [], X[c][f].push(p)), O[c][f][p].push(s);
      }
      for (let s = 0; s <= b; s++) {
        if (!O[s]) continue;
        for (const f in O[s]) {
          N[s][f] = [], X[s][f].sort((v, w) => v - w);
          let p = [];
          for (const v of X[s][f]) {
            const w = O[s][f][v];
            if (w.length === 0) continue;
            const x = w.filter((y) => !y.isGrace), A = w.filter((y) => y.isGrace);
            if (x.length === 0) {
              p.push(...A);
              continue;
            }
            const o = x[0], g = [];
            if (o.isRest)
              g.push("b/4");
            else
              for (const y of x) {
                const P = H[y.pitch.step].toLowerCase();
                g.push(`${P}/${y.pitch.octave}`);
              }
            let G = "q";
            switch (o.durationType) {
              case "whole":
                G = "w";
                break;
              case "half":
                G = "h";
                break;
              case "quarter":
                G = "q";
                break;
              case "eighth":
                G = "8";
                break;
              case "16th":
                G = "16";
                break;
              default:
                G = "q";
            }
            o.isRest && (G += "r");
            const T = new a.StaveNote({
              clef: M[s] || "treble",
              keys: g,
              duration: G
            });
            T.sourceNote = o, x.forEach((y, P) => {
              if (y.pitch.alter !== 0) {
                let S = "";
                y.pitch.alter === 1 ? S = "#" : y.pitch.alter === -1 ? S = "b" : y.pitch.alter === 2 ? S = "##" : y.pitch.alter === -2 && (S = "bb"), S && T.addModifier(new a.Accidental(S), P);
              }
              y.articulations.forEach((S) => {
                let F = "";
                if (a.Modifier.Position.ABOVE, S === "staccato" ? (F = "a.", a.Modifier.Position.BELOW) : S === "accent" ? F = "a>" : S === "marcato" ? F = "a^" : S === "tenuto" ? F = "a-" : S === "fermata" && (F = "a@a"), F) {
                  const j = new a.Articulation(F);
                  T.addModifier(j, P);
                }
              }), y.dynamics && y.dynamics.length > 0 && y.dynamics.forEach((S) => {
                const F = new a.Annotation(S).setFont("Times", 12, "italic").setVerticalJustification(a.Annotation.VerticalJustify.BOTTOM);
                T.addModifier(F, P);
              });
            }), o.lyrics && o.lyrics.length > 0 && o.lyrics.forEach((y) => {
              const P = y.text + (y.syllabic === "begin" || y.syllabic === "middle" ? "-" : ""), S = new a.Annotation(P).setFont("Times", 12, "normal").setVerticalJustification(a.Annotation.VerticalJustify.BOTTOM);
              T.addModifier(S, 0);
            });
            const D = [...p, ...A];
            if (D.length > 0) {
              const y = D.map((S) => {
                const F = H[S.pitch.step].toLowerCase(), j = new a.GraceNote({
                  keys: [`${F}/${S.pitch.octave}`],
                  duration: "8",
                  slash: !0
                });
                if (S.pitch.alter !== 0) {
                  let k = "";
                  S.pitch.alter === 1 ? k = "#" : S.pitch.alter === -1 && (k = "b"), k && j.addModifier(new a.Accidental(k), 0);
                }
                return j;
              }), P = new a.GraceNoteGroup(y);
              T.addModifier(P, 0), p = [];
            }
            f === "1" ? T.setStemDirection(a.Stem.UP) : T.setStemDirection(a.Stem.DOWN), N[s][f].push(T);
            for (const y of w)
              h.set(y, T);
          }
        }
        const c = /* @__PURE__ */ new Set();
        for (const f of n.notes)
          if (f.staffId - 1 === s && f.tuplet && !c.has(f.tuplet)) {
            const p = f.tuplet, v = p.notes.map((w) => h.get(w)).filter((w, x, A) => w && A.indexOf(w) === x);
            if (v.length > 0) {
              const w = new a.Tuplet(v, {
                numNotes: p.actualNotes,
                notesOccupied: p.normalNotes
              });
              E[s].push(w);
            }
            c.add(p);
          }
      }
      let $ = 150;
      for (let s = 0; s <= b; s++) {
        const c = [];
        for (const f in N[s]) {
          const p = new a.Voice({ numBeats: 4, beatValue: 4 });
          p.addTickables(N[s][f]), c.push(p);
        }
        if (c.length > 0)
          try {
            const p = new a.Formatter().joinVoices(c).preCalculateMinTotalWidth(c);
            let v = 20;
            (n.clefs[s] || n.measureNumber === 1) && (v += 40), (n.rhythms[s] || n.measureNumber === 1) && (v += 30), n.keys[s] && (v += 20), $ = Math.max($, p + v);
          } catch {
          }
      }
      const C = [];
      for (let s = 0; s <= b; s++) {
        const c = [];
        for (const f in N[s]) {
          const p = a.Beam.generateBeams(N[s][f]);
          c.push(...p);
        }
        C.push({
          vfVoices: N[s],
          beams: c,
          vfTuplets: E[s],
          clef: n.clefs[s] ? M[s] : void 0,
          keySignature: n.keys[s] || n.measureNumber === 1 ? B[s] : void 0,
          // Draw if explicit or start
          timeSignature: n.rhythms[s] ? I[s] : void 0,
          voltaType: s === 0 ? u : a.Volta.type.NONE,
          voltaNumber: s === 0 ? n.endingNumber : ""
        });
      }
      let L;
      if (n.endBarType !== void 0)
        switch (n.endBarType) {
          case Y.Single:
            L = a.Barline.type.SINGLE;
            break;
          case Y.Double:
            L = a.Barline.type.DOUBLE;
            break;
          case Y.End:
            L = a.Barline.type.END;
            break;
          case Y.RepeatEnd:
            L = a.Barline.type.REPEAT_END;
            break;
          case Y.RepeatBegin:
            L = a.Barline.type.REPEAT_BEGIN;
            break;
          default:
            L = a.Barline.type.SINGLE;
        }
      const q = {
        measureNumber: n.measureNumber,
        staves: C,
        // New structure
        width: $,
        endBarLineType: L
      };
      if (d + q.width > r && i.length > 0) {
        const c = (r - d) / i.length;
        i.forEach((f) => f.width += c), l.push(i), i = [], d = 0;
      }
      i.push(q), d += q.width;
    }
    i.length > 0 && l.push(i);
    const R = [];
    for (const n of m.slurs)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), N = h.get(n.endNote);
        if (u && N) {
          const E = new a.Curve(u, N, {
            thickness: 2,
            xShift: 0,
            yShift: 10
          });
          R.push(E);
        }
      }
    for (const n of m.ties)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), N = h.get(n.endNote);
        if (u && N) {
          const E = new a.StaveTie({
            firstNote: u,
            lastNote: N,
            firstIndexes: [0],
            lastIndexes: [0]
          });
          R.push(E);
        }
      }
    for (const n of m.wedges)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), N = h.get(n.endNote);
        if (u && N) {
          const E = new a.StaveHairpin(
            { firstNote: u, lastNote: N },
            n.type === z.Crescendo ? a.StaveHairpin.type.CRESC : a.StaveHairpin.type.DECRESC
          );
          E.setPosition(a.Modifier.Position.BELOW), R.push(E);
        }
      }
    for (const n of m.octaveShifts)
      if (n.startNote && n.endNote) {
        const u = h.get(n.startNote), N = h.get(n.endNote);
        if (u && N) {
          const E = n.type === J.Up ? "8va" : "8vb", b = n.type === J.Up ? a.TextBracket.Position.TOP : a.TextBracket.Position.BOTTOM, O = new a.TextBracket({
            start: u,
            stop: N,
            text: E,
            position: b
          });
          R.push(O);
        }
      }
    return { systems: l, curves: R };
  }
}
class ft {
  constructor(t) {
    this.container = t, this.renderer = new a.Renderer(t, a.Renderer.Backends.SVG), this.ctx = this.renderer.getContext();
  }
  container;
  renderer;
  ctx;
  draw(t) {
    const { systems: r, curves: l } = t;
    this.ctx.clear();
    const i = 10;
    let d = i, m = 50;
    const h = /* @__PURE__ */ new Map();
    for (const M of r) {
      const I = this.calculateSystemLayout(M);
      let B = 0;
      d = i;
      for (const V of M) {
        const R = V.staves, n = [];
        if (R.forEach((u, N) => {
          const E = m + I[N], b = new a.Stave(d, E, V.width);
          if ((u.clef || d === i) && b.addClef(u.clef || "treble"), u.keySignature && b.addKeySignature(u.keySignature), u.timeSignature && b.addTimeSignature(u.timeSignature), V.endBarLineType !== void 0 && b.setEndBarType(V.endBarLineType), u.voltaType !== void 0 && u.voltaType !== a.Volta.type.NONE && b.setVoltaType(u.voltaType, u.voltaNumber || "1", 0), b.setContext(this.ctx).draw(), n.push(b), Object.keys(u.vfVoices || {}).length > 0) {
            const { voices: X, allNotes: $ } = this.createVoices(u);
            new a.Formatter().joinVoices(X).format(X, V.width - 50), X.forEach((c) => c.draw(this.ctx, b));
            const C = b.getYForLine(0), q = b.getYForLine(4) - C;
            $.forEach((c) => {
              if (c.sourceNote) {
                const f = c.sourceNote.timestamp.RealValue, p = c.getBoundingBox();
                p && (h.has(f) || h.set(f, []), h.get(f).push({
                  x: p.getX(),
                  y: C,
                  height: q
                }));
              }
            }), u.beams && u.beams.forEach((c) => c.setContext(this.ctx).draw()), u.vfTuplets && u.vfTuplets.forEach((c) => c.setContext(this.ctx).draw());
            let s = E + 100;
            $.forEach((c) => {
              const f = c.getBoundingBox();
              f && (s = Math.max(s, f.getY() + f.getH())), c.getModifiers().forEach((p) => {
                p.text_line && (s = Math.max(s, E + 140));
              });
            }), B = Math.max(B, s);
          } else
            B = Math.max(B, E + 100);
        }), n.length > 1 && d === i) {
          const u = new a.StaveConnector(n[0], n[n.length - 1]);
          u.setType(a.StaveConnector.type.BRACE), u.setContext(this.ctx).draw();
          const N = new a.StaveConnector(n[0], n[n.length - 1]);
          N.setType(a.StaveConnector.type.SINGLE_LEFT), N.setContext(this.ctx).draw();
        }
        d += V.width;
      }
      m = B + 60;
    }
    return l && l.forEach((M) => M.setContext(this.ctx).draw()), this.renderer.resize && this.renderer.resize(this.container.clientWidth, m + 100), h;
  }
  /**
   * Calculates the Y positions for each staff in a system to avoid collisions.
   */
  calculateSystemLayout(t) {
    if (t.length === 0) return [];
    const r = t[0].staves.length, l = [0];
    let i = 0;
    for (let d = 0; d < r - 1; d++) {
      let m = 80;
      for (const h of t) {
        const M = h.staves[d], I = h.staves[d + 1], B = this.measureStaffBottom(M, h.width), V = this.measureStaffTop(I, h.width), n = B - V + 10;
        m = Math.max(m, n);
      }
      i += m, l.push(i);
    }
    return l;
  }
  measureStaffBottom(t, r) {
    let l = 80;
    if (Object.keys(t.vfVoices || {}).length === 0) return l;
    const { voices: d, allNotes: m } = this.createVoices(t);
    return new a.Stave(0, 0, r), new a.Formatter().joinVoices(d).format(d, r - 50), m.forEach((h) => {
      h.keys.forEach((I, B) => {
        const R = h.getKeyProps()[B].line * 10;
        l = Math.max(l, R + 20);
      }), h.modifiers.some((I) => I.category === "annotation") && (l += 30);
    }), l;
  }
  measureStaffTop(t, r) {
    let l = 0;
    const i = Object.keys(t.vfVoices || {});
    if (i.length === 0) return l;
    const d = [];
    for (const m of i) d.push(...t.vfVoices[m]);
    return d.forEach((m) => {
      m.keys.forEach((h, M) => {
        const B = m.getKeyProps()[M].line * 10;
        l = Math.min(l, B - 20);
      });
    }), l;
  }
  createVoices(t) {
    let r = 4, l = 4;
    if (t.timeSignature) {
      const h = t.timeSignature.split("/");
      r = parseInt(h[0]), l = parseInt(h[1]);
    }
    const i = [];
    let d = [];
    const m = Object.keys(t.vfVoices || {});
    for (const h of m) {
      const M = t.vfVoices[h], I = new a.Voice({ numBeats: r, beatValue: l });
      I.setStrict(!1), I.addTickables(M), i.push(I), d.push(...M);
    }
    return { voices: i, allNotes: d };
  }
}
class dt {
  static async MXLtoXML(t) {
    const r = new Q();
    try {
      const l = await r.loadAsync(t), i = Object.keys(l.files);
      let d = "META-INF/container.xml", m = i.find((h) => h.endsWith(".xml") && !h.includes("container.xml") && !h.startsWith("__MACOSX"));
      if (m || (m = i.find((h) => h.endsWith(".musicxml") && !h.startsWith("__MACOSX"))), m)
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
  get hidden() {
    return this.cursorElement.style.display === "none";
  }
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
      let l = r[0].y, i = r[0].y + r[0].height, d = r[0].x;
      r.forEach((m) => {
        l = Math.min(l, m.y), i = Math.max(i, m.y + m.height), d = Math.min(d, m.x);
      }), this.cursorElement.style.left = `${d}px`, this.cursorElement.style.top = `${l}px`, this.cursorElement.style.height = `${i - l}px`;
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
        let i = "";
        typeof t == "string" ? (t.startsWith("PK"), i = t) : i = await dt.MXLtoXML(t), this.sheet = ht.readMusicXML(i), r();
      } catch (i) {
        l(i);
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
  tt as MusicSheet,
  yt as OpenSheetMusicDisplay,
  ft as VexFlowMusicSheetDrawer
};
