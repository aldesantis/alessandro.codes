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
      <div class="lazy-card-placeholder bg-white rounded overflow-hidden">
        <div class="w-full h-48 bg-gray-200 animate-pulse"></div>
        <div class="p-4 space-y-4">
          <div class="h-6 bg-gray-200 rounded animate-pulse"></div>
          <div class="flex space-x-2">
            <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-4/6"></div>
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
      this.element.innerHTML = `
        <div class="bg-white rounded overflow-hidden border border-red-200 dark:border-red-800">
          <div class="p-4 flex items-center justify-center min-h-[200px]">
            <div class="text-red-500 dark:text-red-400 text-sm">Failed to load card</div>
          </div>
        </div>
      `;
    } finally {
      this.isLoading = false;
    }
  }
}
