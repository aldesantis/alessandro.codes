// Small DOM helpers shared by the figure controllers.

export function setAttributes(element: Element, attributes: Record<string, string | number>) {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
}

// Marks the button at `selected` as pressed, for `SegmentedControl` groups.
export function setPressed(buttons: HTMLElement[], selected: number) {
  buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === selected)));
}

// The `data-index` of the `SegmentedControl` button that fired the event.
export function eventIndex(event: Event): number {
  return Number((event.currentTarget as HTMLElement).dataset.index);
}

// Keeps a `Slider` in step with its value: the filled part of the track, and
// `aria-valuetext` so screen readers announce what the value means instead of
// a bare number.
export function syncSlider(input: HTMLInputElement, valueText: string) {
  input.style.setProperty("--viz-fill", `${input.value}%`);
  input.setAttribute("aria-valuetext", valueText);
}

// Describes a `Slider`'s value against the labels at either end of its track,
// e.g. "30%, toward Fully specified".
export function describeScale(input: HTMLInputElement) {
  const value = Number(input.value);
  const [low, high] = JSON.parse(input.dataset.vizEnds ?? '["low", "high"]') as [string, string];
  if (value <= 5) return low;
  if (value >= 95) return high;
  if (value === 50) return `50%, halfway between ${low} and ${high}`;
  return `${value}%, toward ${value < 50 ? low : high}`;
}
