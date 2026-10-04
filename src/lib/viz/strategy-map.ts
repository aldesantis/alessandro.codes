// Shared geometry for the strategy map: x runs from execution (0) to strategy
// (1), y from necessity (0) to advantage (1). Imported by both the Astro
// component (static SVG) and the Stimulus controllers (live updates).

import { linePath, linearScale } from "./chart";

export const PLOT = { left: 44, top: 12, width: 340, height: 320 };
export const VIEWBOX = { width: PLOT.left + PLOT.width + 8, height: PLOT.top + PLOT.height + 40 };

export const toX = linearScale([0, 1], [PLOT.left, PLOT.left + PLOT.width]);
export const toY = linearScale([0, 1], [PLOT.top + PLOT.height, PLOT.top]);

// AI absorbs execution before strategy, and necessities before advantages, so
// "exposure" weighs the x axis more than the y axis.
const WEIGHT_X = 0.6;
const WEIGHT_Y = 0.4;

export const exposure = (x: number, y: number) => WEIGHT_X * x + WEIGHT_Y * y;

// Maps the capability slider (0–100) to the exposure level AI has reached.
export const frontierLevel = (capability: number) => 0.08 + (capability / 100) * 0.62;

export const TODAY = 40;

// Everything with exposure below `level` is inside the frontier.
export function frontierPath(level: number): string {
  const points: [number, number][] = [[0, 0]];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const y = Math.max(0, Math.min(1, (level - WEIGHT_X * x) / WEIGHT_Y));
    points.push([x, y]);
  }
  points.push([1, 0]);
  return linePath(points.map(([x, y]) => [toX(x), toY(y)])) + "Z";
}

// Just the boundary, for the stroked edge of the frontier.
export function frontierEdge(level: number): string {
  const points: [number, number][] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const raw = (level - WEIGHT_X * x) / WEIGHT_Y;
    if (raw < 0 || raw > 1) continue;
    points.push([toX(x), toY(raw)]);
  }
  return points.length > 1 ? linePath(points) : "";
}
