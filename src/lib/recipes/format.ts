// Pure formatting helpers shared between server-rendered components and
// client-side controllers. Must not import `astro:content`.

// Units rendered as abbreviations and never pluralized.
const UNIT_ABBREVIATIONS: Record<string, string> = {
  grams: "g",
  milliliters: "ml",
};

const FRACTION_GLYPHS: Record<number, string> = {
  0.25: "¼",
  0.5: "½",
  0.75: "¾",
};

function pluralize(word: string): string {
  if (word.endsWith("ss")) {
    return `${word}es`; // glass → glasses
  }
  if (word.endsWith("s")) {
    return word; // assume already plural (e.g. "sprigs", "leaves", "fillets")
  }
  if (/(x|z|ch|sh)$/.test(word)) {
    return `${word}es`; // pinch → pinches, bunch → bunches
  }
  return `${word}s`;
}

/**
 * Renders a unit for display: abbreviations stay singular, "count" is dropped,
 * everything else is pluralized when the quantity is above 1 (fractions read
 * as singular: "¾ lemon").
 */
export function formatUnit(unit: string, quantity?: number): string {
  const abbreviation = UNIT_ABBREVIATIONS[unit];
  if (abbreviation) {
    return abbreviation;
  }

  if (unit === "count") {
    return "";
  }

  return quantity !== undefined && quantity > 1 ? pluralize(unit) : unit;
}

/**
 * Rounds a quantity for display: large values to whole numbers, small ones to
 * the nearest quarter. A non-zero quantity never rounds down to zero.
 */
function roundQuantity(value: number): number {
  if (value >= 10) {
    return Math.round(value);
  }

  return Math.max(Math.round(value * 4), value > 0 ? 1 : 0) / 4;
}

/**
 * Renders a quantity for display, using fraction glyphs (2½, ¾) for the
 * quarters small values round to.
 */
export function formatQuantity(value: number): string {
  const rounded = roundQuantity(value);
  const whole = Math.floor(rounded);
  const fraction = FRACTION_GLYPHS[rounded - whole] ?? "";

  if (whole === 0) {
    return fraction || "0";
  }

  return `${whole}${fraction}`;
}

/**
 * Renders a quantity with its optional unit (`1½ glasses`, `330 g`, `2`),
 * pluralizing against the rounded quantity so the unit always agrees with the
 * number shown.
 */
export function formatQuantityWithUnit(value: number, unit?: string): string {
  const quantity = formatQuantity(value);
  const formattedUnit = unit ? formatUnit(unit, roundQuantity(value)) : "";
  return formattedUnit ? `${quantity} ${formattedUnit}` : quantity;
}
