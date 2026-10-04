import { Controller } from "@hotwired/stimulus";

const bar = (width = "") => `<div class="h-3 ${width} rounded-md bg-rule motion-safe:animate-pulse"></div>`;

/** Cover shapes per collection, matching the real cards; text-only collections have none. */
const COVER_CLASSES: Record<string, string> = {
  books: "aspect-[2/3]",
  recipes: "aspect-square",
  talks: "aspect-video",
};

/**
 * A grid slot for a card the server didn't render (after a filter change or
 * "Show more"). Shows a skeleton shaped like the collection's card, fetches the
 * prerendered card from /card/<collection>/<id>, then swaps itself for a fresh
 * slot holding the card, which fades in via @starting-style.
 */
export default class ContentCardController extends Controller<HTMLElement> {
  static override values = {
    id: { type: String, required: true },
    collection: { type: String, required: true },
  };

  declare idValue: string;
  declare collectionValue: string;

  private abortController: AbortController | null = null;

  override connect(): void {
    this.element.innerHTML = this.getPlaceholderHTML();
    this.loadCard();
  }

  override disconnect(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  private getPlaceholderHTML(): string {
    const coverClass = COVER_CLASSES[this.collectionValue];
    const cover = coverClass ? `<div class="${coverClass} w-full bg-rule motion-safe:animate-pulse"></div>` : "";
    const excerpt = coverClass ? "" : `<div class="space-y-2">${bar()}${bar("w-5/6")}${bar("w-4/6")}</div>`;

    return `
      <div class="flex h-full flex-col overflow-hidden rounded-lg border border-rule bg-surface" aria-hidden="true">
        ${cover}
        <div class="space-y-3 p-4">
          <div class="h-5 w-3/4 rounded-md bg-rule motion-safe:animate-pulse"></div>
          ${bar("w-1/3")}
          ${excerpt}
        </div>
      </div>
    `;
  }

  private async loadCard(): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(
        `/card/${encodeURIComponent(this.collectionValue)}/${encodeURIComponent(this.idValue)}`,
        { signal: this.abortController.signal }
      );

      if (!response.ok) {
        throw new Error(`Failed to load card: ${response.statusText}`);
      }

      const temp = document.createElement("div");
      temp.innerHTML = (await response.text()).trim();

      // The card's root element (an <a> for linked cards, a plain card for talks).
      // Responses may put <script>/<link> tags first, so look it up by its marker.
      const card = temp.querySelector("[data-card]");
      if (!card) {
        throw new Error("No content received");
      }

      const slot = document.createElement("div");
      slot.className = "min-w-0 transition-opacity duration-200 ease-out-strong starting:opacity-0";
      slot.appendChild(card);
      const hadFocus = document.activeElement === this.element;
      this.element.replaceWith(slot);
      if (hadFocus) {
        (card.matches("a") ? (card as HTMLElement) : card.querySelector<HTMLElement>("a"))?.focus({
          preventScroll: true,
        });
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;

      console.error(`Error loading card for ${this.idValue}:`, error);
      this.element.innerHTML = `<div class="h-full rounded-lg border border-rule bg-surface p-4 font-sans text-sm text-ink-muted">This entry couldn’t be loaded.</div>`;
    }
  }
}
