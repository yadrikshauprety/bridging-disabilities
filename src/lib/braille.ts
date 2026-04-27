// Grade 1 English Braille — Unicode Braille block (U+2800).
// Each letter is one cell. Capital indicator: ⠠ (dot 6). Number indicator: ⠼.
// Numbers 1–9,0 reuse letters a–j after the number indicator.

const LETTERS: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓",
  i: "⠊", j: "⠚", k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏",
  q: "⠟", r: "⠗", s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭",
  y: "⠽", z: "⠵",
};

const PUNCT: Record<string, string> = {
  ",": "⠂", ";": "⠆", ":": "⠒", ".": "⠲", "!": "⠖",
  "?": "⠦", "'": "⠄", '"': "⠶", "-": "⠤", "/": "⠌",
  "(": "⠐⠣", ")": "⠐⠜",
};

const NUMBER_INDICATOR = "⠼";
const CAPITAL_INDICATOR = "⠠";

// Numbers 0-9 reuse a-j: 1=a, 2=b, ... 9=i, 0=j
const DIGITS: Record<string, string> = {
  "1": LETTERS.a, "2": LETTERS.b, "3": LETTERS.c, "4": LETTERS.d, "5": LETTERS.e,
  "6": LETTERS.f, "7": LETTERS.g, "8": LETTERS.h, "9": LETTERS.i, "0": LETTERS.j,
};

export function toBraille(input: string): string {
  let out = "";
  let inNumberMode = false;
  for (const ch of input) {
    if (/[0-9]/.test(ch)) {
      if (!inNumberMode) { out += NUMBER_INDICATOR; inNumberMode = true; }
      out += DIGITS[ch];
      continue;
    }
    inNumberMode = false;
    if (/[A-Z]/.test(ch)) {
      out += CAPITAL_INDICATOR + LETTERS[ch.toLowerCase()];
    } else if (/[a-z]/.test(ch)) {
      out += LETTERS[ch];
    } else if (PUNCT[ch]) {
      out += PUNCT[ch];
    } else if (ch === " ") {
      out += " ";
    } else if (ch === "\n") {
      out += "\n";
    } else {
      // Unknown char — leave as-is for transparency
      out += ch;
    }
  }
  return out;
}

export const BRAILLE_LETTERS = LETTERS;
