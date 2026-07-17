/**
 * WCAG 2.x contrast ratio utilities.
 * Reference: https://www.w3.org/TR/WCAG21/#contrast-minimum
 */

/** Parses "#rgb", "#rrggbb", or "rgb(a)/hsl" CSS color strings into an [r,g,b] tuple (0-255). */
export function parseColorToRgb(color) {
  if (!color) return null;
  const value = color.trim();

  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [r, g, b];
  }

  const rgbMatch = value.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/i
  );
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  return null;
}

/** Converts an sRGB channel (0-255) to linear light per the WCAG spec. */
function channelToLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Computes the relative luminance of an [r,g,b] color per WCAG. */
export function relativeLuminance([r, g, b]) {
  const [rl, gl, bl] = [r, g, b].map(channelToLinear);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Computes the WCAG contrast ratio (1 to 21) between two colors.
 * Each color may be a hex string, rgb()/rgba() string, or [r,g,b] array.
 */
export function contrastRatio(colorA, colorB) {
  const rgbA = Array.isArray(colorA) ? colorA : parseColorToRgb(colorA);
  const rgbB = Array.isArray(colorB) ? colorB : parseColorToRgb(colorB);
  if (!rgbA || !rgbB) return null;

  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Returns WCAG pass/fail info for a given contrast ratio. */
export function evaluateContrast(ratio) {
  if (ratio === null || Number.isNaN(ratio)) {
    return { normalAA: false, normalAAA: false, largeAA: false, largeAAA: false };
  }
  return {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
  };
}

export function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}
