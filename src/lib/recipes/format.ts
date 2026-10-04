// Pure formatting helpers shared between server-rendered components and
// client-side controllers. Must not import `astro:content`.

type MetricKind = "mass" | "volume" | "length";

interface MetricUnit {
  symbol: string;
  kind: MetricKind;
  /** Multiplier to the kind's base symbol (g, ml); unused for lengths. */
  factor: number;
}

// Metric units are rendered as symbols, never pluralized and never shown with
// fraction glyphs. Keys cover every spelling the vault uses (or plausibly
// could).
const METRIC_UNITS: Record<string, MetricUnit> = {
  g: { symbol: "g", kind: "mass", factor: 1 },
  gram: { symbol: "g", kind: "mass", factor: 1 },
  grams: { symbol: "g", kind: "mass", factor: 1 },
  kg: { symbol: "kg", kind: "mass", factor: 1000 },
  kilogram: { symbol: "kg", kind: "mass", factor: 1000 },
  kilograms: { symbol: "kg", kind: "mass", factor: 1000 },
  ml: { symbol: "ml", kind: "volume", factor: 1 },
  milliliter: { symbol: "ml", kind: "volume", factor: 1 },
  milliliters: { symbol: "ml", kind: "volume", factor: 1 },
  millilitre: { symbol: "ml", kind: "volume", factor: 1 },
  millilitres: { symbol: "ml", kind: "volume", factor: 1 },
  l: { symbol: "l", kind: "volume", factor: 1000 },
  liter: { symbol: "l", kind: "volume", factor: 1000 },
  liters: { symbol: "l", kind: "volume", factor: 1000 },
  litre: { symbol: "l", kind: "volume", factor: 1000 },
  litres: { symbol: "l", kind: "volume", factor: 1000 },
  mm: { symbol: "mm", kind: "length", factor: 0.1 },
  millimeter: { symbol: "mm", kind: "length", factor: 0.1 },
  millimeters: { symbol: "mm", kind: "length", factor: 0.1 },
  cm: { symbol: "cm", kind: "length", factor: 1 },
  centimeter: { symbol: "cm", kind: "length", factor: 1 },
  centimeters: { symbol: "cm", kind: "length", factor: 1 },
};

// Mass and volume roll up to the larger unit from 1000 (g → kg, ml → l).
const METRIC_SCALE: Partial<Record<MetricKind, { base: string; large: string }>> = {
  mass: { base: "g", large: "kg" },
  volume: { base: "ml", large: "l" },
};

// Non-metric abbreviations: shown as symbols and never pluralized, but still
// rounded to kitchen fractions (½ tsp).
const ABBREVIATIONS: Record<string, string> = {
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
};

// Explicit singular → plural forms for countable units. Inputs may arrive in
// either form ("sprig" and "sprigs" both occur), so a reverse lookup is built
// below and the right form is picked from the quantity.
const PLURALS: Record<string, string> = {
  bunch: "bunches",
  can: "cans",
  clove: "cloves",
  cup: "cups",
  fillet: "fillets",
  glass: "glasses",
  handful: "handfuls",
  head: "heads",
  leaf: "leaves",
  lemon: "lemons",
  pack: "packs",
  piece: "pieces",
  pinch: "pinches",
  sachet: "sachets",
  sheet: "sheets",
  slice: "slices",
  sprig: "sprigs",
  stalk: "stalks",
  stick: "sticks",
};

const SINGULARS: Record<string, string> = Object.fromEntries(
  Object.entries(PLURALS).map(([singular, plural]) => [plural, singular])
);

// Units that describe an amount you judge rather than measure: never scaled
// with servings.
const UNSCALABLE_UNITS = new Set(["pinch", "pinches", "to taste", "dash", "dashes"]);

// Kitchen fractions countable/imperial quantities snap to.
const FRACTIONS: [number, string][] = [
  [0, ""],
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [1, ""],
];

const integerFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

/**
 * Inflects a single word. The last word of a compound unit carries the
 * number ("small espresso cup" → "small espresso cups").
 */
function inflectWord(word: string, plural: boolean): string {
  const singular = SINGULARS[word] ?? word;

  if (!plural) {
    return singular;
  }
  if (PLURALS[singular]) {
    return PLURALS[singular];
  }
  if (word !== singular || /[^s]s$/.test(word)) {
    return word; // already plural
  }
  if (/(s|x|z|ch|sh)$/.test(word)) {
    return `${word}es`;
  }
  return `${word}s`;
}

function inflect(unit: string, plural: boolean): string {
  const words = unit.split(" ");
  const last = words.pop()!;
  return [...words, inflectWord(last, plural)].join(" ");
}

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

/** Whether a unit's quantity should follow the servings stepper. */
export function isScalableUnit(unit?: string): boolean {
  return !unit || !UNSCALABLE_UNITS.has(normalizeUnit(unit));
}

/** Snaps a countable quantity to the nearest kitchen fraction. */
function roundToFraction(value: number): { value: number; text: string } {
  if (value >= 10) {
    const rounded = Math.round(value);
    return { value: rounded, text: integerFormat.format(rounded) };
  }

  const whole = Math.floor(value);
  let [fraction, glyph] = FRACTIONS[0]!;

  for (const candidate of FRACTIONS) {
    if (Math.abs(value - whole - candidate[0]) < Math.abs(value - whole - fraction)) {
      [fraction, glyph] = candidate;
    }
  }

  // A non-zero quantity never rounds down to nothing.
  if (whole === 0 && fraction === 0 && value > 0) {
    [fraction, glyph] = FRACTIONS[1]!;
  }

  const total = whole + fraction;
  const wholeText = Math.floor(total) > 0 ? integerFormat.format(Math.floor(total)) : "";
  return { value: total, text: `${wholeText}${glyph}` || "0" };
}

/**
 * Rounds a metric quantity to a sensible precision, rolling grams and
 * milliliters up to kilograms and liters from 1000. Decimals only appear
 * below 10 (and up to two for kg/l), never fraction glyphs.
 */
function roundMetric(value: number, unit: MetricUnit): { value: number; text: string; symbol: string } {
  const scale = METRIC_SCALE[unit.kind];
  let amount = value;
  let symbol = unit.symbol;

  if (scale) {
    amount = value * unit.factor;
    symbol = scale.base;

    // Compare against the rounded value so 999.6 g reads "1 kg", not "1,000 g".
    if (Math.round(amount) >= 1000) {
      amount /= 1000;
      symbol = scale.large;
    }
  }

  const isLarge = symbol === scale?.large;
  const maximumFractionDigits = amount >= 10 ? (isLarge ? 1 : 0) : isLarge ? 2 : 1;
  const step = 10 ** -maximumFractionDigits;
  const rounded = Math.max(Math.round(amount / step) * step, amount > 0 ? step : 0);

  return {
    value: rounded,
    text: new Intl.NumberFormat("en", { maximumFractionDigits }).format(rounded),
    symbol,
  };
}

/**
 * Renders a quantity with its optional unit (`1½ cloves`, `330 g`, `1.2 kg`,
 * `2`), inflecting the unit against the rounded quantity so it always agrees
 * with the number shown. Quantities up to 1 (fractions included) read as
 * singular: "¾ lemon", "1 leaf".
 */
export function formatQuantityWithUnit(value: number, unit?: string): string {
  const key = unit ? normalizeUnit(unit) : "";
  const metric = METRIC_UNITS[key];

  if (metric) {
    const { text, symbol } = roundMetric(value, metric);
    return `${text} ${symbol}`;
  }

  const { value: rounded, text } = roundToFraction(value);

  if (!unit || key === "count") {
    return text;
  }

  const abbreviation = ABBREVIATIONS[key];
  const formattedUnit = abbreviation ?? inflect(unit.trim(), rounded > 1);
  return `${text} ${formattedUnit}`;
}

/**
 * Renders the parenthetical after an ingredient name, e.g. " (160 g, Venere)".
 * Quantity and note are comma-separated; either may be omitted.
 */
export function formatIngredientDetails(
  quantity: number | undefined,
  unit: string | undefined,
  note: string | undefined
): string {
  const parts: string[] = [];

  if (quantity !== undefined) {
    parts.push(formatQuantityWithUnit(quantity, unit));
  }
  if (note) {
    parts.push(note);
  }

  return parts.length > 0 ? `(${parts.join(", ")})` : "";
}
