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
