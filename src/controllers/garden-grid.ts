import { Controller } from "@hotwired/stimulus";
import { actions } from "astro:actions";
import type { SearchResult } from "src/lib/garden/config";
import type { GardenEntryTypeId } from "src/lib/garden/entries";

type SearchResultResponse = SearchResult & {
  url: string;
};

export default class GardenGridController extends Controller {
  static override targets = ["grid", "loadingTemplate", "emptyTemplate", "errorTemplate", "cardTemplate"];
  static override values = {
    searchParams: { type: Object, default: {} },
  };

  declare readonly gridTarget: HTMLElement;
  declare readonly loadingTemplateTarget: HTMLTemplateElement;
  declare readonly emptyTemplateTarget: HTMLTemplateElement;
  declare readonly errorTemplateTarget: HTMLTemplateElement;
  declare readonly cardTemplateTarget: HTMLTemplateElement;
  declare searchParamsValue: { name?: string; collections?: GardenEntryTypeId[] };

  private isLoading = false;

  override connect(): void {
    this.performSearch();
  }

  async performSearch(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showLoading();

    try {
      const result = await actions.search(this.searchParamsValue);

      if (result.error) {
        console.error("Error fetching search results:", result.error);
        this.showError();
        return;
      }

      const items = result.data.items;

      if (items.length === 0) {
        this.showEmpty();
        return;
      }

      this.renderCards(items);
    } catch (error) {
      console.error("Error fetching search results:", error);
      this.showError();
    } finally {
      this.isLoading = false;
    }
  }

  private renderCards(items: SearchResultResponse[]): void {
    this.gridTarget.innerHTML = "";

    items.forEach((item) => {
      const clone = this.cardTemplateTarget.content.cloneNode(true) as DocumentFragment;
      const cardElement = clone.firstElementChild as HTMLElement;

      cardElement.setAttribute("data-garden-lazy-card-entry-id-value", item.id);
      cardElement.setAttribute("data-garden-lazy-card-entry-collection-value", item.type);

      this.gridTarget.appendChild(cardElement);
    });
  }

  private showLoading(): void {
    const clone = this.loadingTemplateTarget.content.cloneNode(true) as DocumentFragment;
    this.gridTarget.innerHTML = "";
    this.gridTarget.appendChild(clone);
  }

  private showEmpty(): void {
    const clone = this.emptyTemplateTarget.content.cloneNode(true) as DocumentFragment;
    this.gridTarget.innerHTML = "";
    this.gridTarget.appendChild(clone);
  }

  private showError(): void {
    const clone = this.errorTemplateTarget.content.cloneNode(true) as DocumentFragment;
    this.gridTarget.innerHTML = "";
    this.gridTarget.appendChild(clone);
  }
}
