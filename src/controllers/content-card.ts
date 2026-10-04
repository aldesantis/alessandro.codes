import { Controller } from "@hotwired/stimulus";

export default class GardenLazyCardController extends Controller {
  static override values = {
    id: { type: String, required: true },
    collection: { type: String, required: true },
  };

  declare idValue: string;
  declare collectionValue: string;

  private observer: IntersectionObserver | null = null;
  private isLoading = false;
  private isLoaded = false;

  override connect(): void {
    this.element.innerHTML = this.getPlaceholderHTML();

    const observerOptions = {
      root: null,
      rootMargin: "50px",
      threshold: 0.01,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isLoading && !this.isLoaded) {
          this.loadCard();
          if (this.observer) {
            this.observer.unobserve(this.element);
          }
        }
      });
    }, observerOptions);

    this.observer.observe(this.element);
  }

  override disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private getPlaceholderHTML(): string {
    return `
      <div class="overflow-hidden rounded-lg border border-rule bg-surface" aria-hidden="true">
        <div class="h-48 w-full bg-rule motion-safe:animate-pulse"></div>
        <div class="space-y-4 p-4">
          <div class="h-6 rounded-md bg-rule motion-safe:animate-pulse"></div>
          <div class="flex gap-2">
            <div class="h-4 w-20 rounded-md bg-rule motion-safe:animate-pulse"></div>
            <div class="h-4 w-16 rounded-md bg-rule motion-safe:animate-pulse"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3 rounded-md bg-rule motion-safe:animate-pulse"></div>
            <div class="h-3 w-5/6 rounded-md bg-rule motion-safe:animate-pulse"></div>
            <div class="h-3 w-4/6 rounded-md bg-rule motion-safe:animate-pulse"></div>
          </div>
        </div>
      </div>
    `;
  }

  private async loadCard(): Promise<void> {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    this.isLoading = true;

    try {
      const response = await fetch(
        `/card/${encodeURIComponent(this.collectionValue)}/${encodeURIComponent(this.idValue)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to load card: ${response.statusText}`);
      }

      const html = await response.text();

      // Create a temporary container to parse the HTML
      const temp = document.createElement("div");
      temp.innerHTML = html.trim();

      // Replace placeholder with the fetched content
      const cardContent = temp.querySelector("a") as HTMLAnchorElement;

      if (cardContent) {
        this.element.innerHTML = "";
        this.element.appendChild(cardContent);
        this.isLoaded = true;
      } else {
        throw new Error("No content received");
      }
    } catch (error) {
      console.error(`Error loading card for ${this.idValue}:`, error);
      this.element.innerHTML = `<div class="rounded-lg border border-rule bg-surface p-4 font-sans text-sm text-ink-muted">This entry couldn’t be loaded.</div>`;
    } finally {
      this.isLoading = false;
    }
  }
}
