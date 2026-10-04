// Datasets for the essay figures. Every value was read from the source cited
// next to it.

// Historical Statistics of the United States, Millennial Edition, Table
// Dd848-853 (Atack & Bateman): horsepower of electric motors in manufacturing,
// thousand hp, split by whether the motors ran on purchased electricity or on
// electricity generated at the establishment. 1899 uses the series that
// matches Devine (1983), Table 3.
export const FACTORY_POWER = [
  { year: 1899, purchased: 178, onSite: 297 },
  { year: 1904, purchased: 428, onSite: 1089 },
  { year: 1909, purchased: 1669, onSite: 2913 },
  { year: 1914, purchased: 3707, onSite: 4684 },
  { year: 1919, purchased: 8965, onSite: 6647 },
  { year: 1925, purchased: 15116, onSite: 9976 },
  { year: 1927, purchased: 18224, onSite: 10929 },
  { year: 1929, purchased: 21794, onSite: 12050 },
  { year: 1939, purchased: 28816, onSite: 16011 },
];

// Si, Hashimoto & Yang (2025), Tables 4–5: mean reviewer scores (1–10) for
// the same ideas before and after ~100 hours of execution.
export const IDEATION_GAP: { metric: string; human: [number, number]; ai: [number, number] }[] = [
  { metric: "Novelty", human: [4.912, 4.903], ai: [5.778, 4.729] },
  { metric: "Excitement", human: [4.404, 4.482], ai: [5.653, 3.896] },
  { metric: "Effectiveness", human: [4.833, 4.782], ai: [6.003, 4.125] },
  { metric: "Overall", human: [4.596, 3.968], ai: [5.382, 3.406] },
];

// METR, Time Horizon 1.1 (metr.org/time-horizons, updated May 8, 2026): the
// length of task, in minutes of human expert time, that frontier models
// complete with 50% reliability. State-of-the-art models only.
export const TIME_HORIZONS = [
  { model: "GPT-2", date: "2019-02-14", minutes: 0.054 },
  { model: "GPT-3", date: "2020-05-28", minutes: 0.144 },
  { model: "GPT-3.5", date: "2022-03-15", minutes: 0.6 },
  { model: "GPT-4", date: "2023-03-14", minutes: 3.99 },
  { model: "GPT-4o", date: "2024-05-13", minutes: 6.99 },
  { model: "Claude 3.5 Sonnet", date: "2024-06-20", minutes: 11.4 },
  { model: "o1-preview", date: "2024-09-12", minutes: 20.3 },
  { model: "Claude 3.5 Sonnet (new)", date: "2024-10-22", minutes: 20.5 },
  { model: "o1", date: "2024-12-05", minutes: 38.8 },
  { model: "Claude 3.7 Sonnet", date: "2025-02-24", minutes: 60.4 },
  { model: "o3", date: "2025-04-16", minutes: 119.7 },
  { model: "GPT-5", date: "2025-08-07", minutes: 203.0 },
  { model: "Gemini 3 Pro", date: "2025-11-18", minutes: 224.3 },
  { model: "Claude Opus 4.5", date: "2025-11-24", minutes: 293.0 },
  { model: "GPT-5.2", date: "2025-12-11", minutes: 352.2 },
  { model: "Claude Opus 4.6", date: "2026-02-05", minutes: 718.8 },
  { model: "Claude Mythos Preview", date: "2026-04-07", minutes: 1044.8 },
];

// METR's own reliability ceiling for the current task suite.
export const HORIZON_RELIABLE_MAX = 16 * 60;

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)} sec`;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${hours < 10 ? Number(hours.toFixed(1)) : Math.round(hours)} hr`;
}
