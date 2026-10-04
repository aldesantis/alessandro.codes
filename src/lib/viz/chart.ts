// Geometry helpers for hand-rolled SVG charts. Pure functions, so they work in
// both Astro components (static SVG) and Stimulus controllers (live updates).

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PlotArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export type Scale = (value: number) => number;

// The drawable area inside a viewBox once the margins are taken out.
export function plotArea(width: number, height: number, margin: Margin): PlotArea {
  return {
    left: margin.left,
    right: width - margin.right,
    top: margin.top,
    bottom: height - margin.bottom,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };
}

// Maps `domain` onto `range`. For a y axis, pass `[plot.bottom, plot.top]` so
// larger values sit higher.
export function linearScale([d0, d1]: [number, number], [r0, r1]: [number, number]): Scale {
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

export function logScale([d0, d1]: [number, number], [r0, r1]: [number, number]): Scale {
  return (value) => r0 + (Math.log(value / d0) / Math.log(d1 / d0)) * (r1 - r0);
}

// An open polyline through `points`, in viewBox coordinates.
export function linePath(points: [number, number][]): string {
  if (points.length === 0) return "";
  return "M" + points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L");
}
