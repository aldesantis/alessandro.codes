import { Controller } from "@hotwired/stimulus";
import { actions } from "astro:actions";
import type { SearchResult } from "zendo";
import type { ZendoCollectionId } from "src/garden";

type SearchResultResponse = SearchResult & {
  url: string;
};

interface Filters {
  [category: string]: string[];
}

export default class ContentGridController extends Controller {
  static override targets = [
    "grid",
    "loadingTemplate",
    "emptyTemplate",
    "errorTemplate",
    "cardTemplate",
    "checkbox",
    "allCheckbox",
    "filterCount",
  ];
  static override values = {
    searchParams: { type: Object, default: {} },
    filters: { type: Object, default: {} },
  };

  declare readonly gridTarget: HTMLElement;
  declare readonly loadingTemplateTarget: HTMLTemplateElement;
  declare readonly emptyTemplateTarget: HTMLTemplateElement;
  declare readonly errorTemplateTarget: HTMLTemplateElement;
  declare readonly cardTemplateTarget: HTMLTemplateElement;
  declare readonly checkboxTargets: HTMLInputElement[];
  declare readonly allCheckboxTargets: HTMLInputElement[];
  declare readonly filterCountTargets: HTMLElement[];
  declare searchParamsValue: {
    name?: string;
    collections?: ZendoCollectionId[];
    status?: string[];
    topics?: string[];
    cuisine?: string[];
    diet?: string[];
    recipeType?: string[];
    relatedTo?: string;
  };
  declare filtersValue: Filters;

  // Incremented per search so a slow, superseded response never overwrites a newer one.
  private searchId = 0;

  override connect(): void {
    this.readFiltersFromUrl();
    this.updateCheckboxStates();
    this.performSearch();
  }

  updateFilter(event: Event): void {
    const checkbox = event.currentTarget as HTMLInputElement;
    const { filterType, filterCategory } = checkbox.dataset;
    const isChecked = checkbox.checked;

    if (!filterType || !filterCategory) {
      return;
    }

    if (filterType === "all") {
      this.handleAllFilter(filterCategory, isChecked, checkbox);
    } else {
      this.handleSpecificFilter(filterCategory, filterType, isChecked);
    }

    this.updateCheckboxStates();
    this.writeFiltersToUrl();
    this.performSearch();
  }

  /**
   * Restores filters from the query string (e.g. `?topics=a,b&status=evergreen`)
   * so filtered views are deep-linkable. Unknown values are ignored.
   */
  private readFiltersFromUrl(): void {
    const categories = Object.keys(this.filtersValue);
    if (categories.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const filters: Filters = { ...this.filtersValue };

    for (const category of categories) {
      const raw = params.get(category);
      if (!raw) continue;

      const known = new Set(
        this.checkboxTargets
          .filter((cb) => cb.dataset.filterCategory === category)
          .map((cb) => cb.dataset.filterType)
          .filter((type): type is string => Boolean(type))
      );
      const selected = [...new Set(raw.split(","))].filter((value) => known.has(value));

      filters[category] = selected.length > 0 ? selected : ["all"];
    }

    this.filtersValue = filters;
  }

  /** Mirrors the selected filters into the query string without adding history entries. */
  private writeFiltersToUrl(): void {
    const categories = Object.keys(this.filtersValue);
    if (categories.length === 0) return;

    const url = new URL(window.location.href);

    for (const category of categories) {
      const selected = this.filtersValue[category] || ["all"];
      if (selected.includes("all")) {
        url.searchParams.delete(category);
      } else {
        url.searchParams.set(category, selected.join(","));
      }
    }

    // Keep commas readable: ?topics=a,b rather than ?topics=a%2Cb.
    const search = url.searchParams.toString().replace(/%2C/gi, ",");
    window.history.replaceState(window.history.state, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
  }

  private updateFilterCounts(): void {
    for (const badge of this.filterCountTargets) {
      const category = badge.dataset.filterCategory;
      const selected = (category && this.filtersValue[category]) || ["all"];
      const count = selected.includes("all") ? 0 : selected.length;

      badge.textContent = count > 0 ? String(count) : "";
      badge.classList.toggle("hidden", count === 0);
    }
  }

  private handleAllFilter(category: string, isChecked: boolean, checkbox: HTMLInputElement): void {
    if (isChecked) {
      this.filtersValue = { ...this.filtersValue, [category]: ["all"] };
      this.uncheckOtherCheckboxes(checkbox);
    } else {
      checkbox.checked = true;
    }
  }

  private handleSpecificFilter(category: string, filterType: string, isChecked: boolean): void {
    const currentFilters = this.filtersValue[category] || ["all"];
    const allCheckbox = this.allCheckboxTargets.find((cb) => cb.dataset.filterCategory === category);

    if (isChecked) {
      const newFilters = currentFilters.filter((f) => f !== "all");
      this.filtersValue = { ...this.filtersValue, [category]: [...newFilters, filterType] };
      if (allCheckbox) allCheckbox.checked = false;
    } else {
      const newFilters = currentFilters.filter((f) => f !== filterType);
      this.filtersValue = {
        ...this.filtersValue,
        [category]: newFilters.length ? newFilters : ["all"],
      };
      if (newFilters.length === 0 && allCheckbox) allCheckbox.checked = true;
    }
  }

  private uncheckOtherCheckboxes(checkbox: HTMLInputElement): void {
    const { filterCategory } = checkbox.dataset;
    if (!filterCategory) {
      return;
    }

    this.checkboxTargets
      .filter((cb) => cb.dataset.filterCategory === filterCategory && cb.dataset.filterType !== "all")
      .forEach((cb) => (cb.checked = false));
  }

  private updateCheckboxStates(): void {
    this.updateFilterCounts();

    Object.keys(this.filtersValue).forEach((category) => {
      const selectedFilters = this.filtersValue[category] || ["all"];
      const isAllSelected = selectedFilters.includes("all");

      const allCheckbox = this.allCheckboxTargets.find((cb) => cb.dataset.filterCategory === category);
      if (allCheckbox) {
        allCheckbox.checked = isAllSelected;
      }

      this.checkboxTargets
        .filter((cb) => cb.dataset.filterCategory === category && cb.dataset.filterType !== "all")
        .forEach((cb) => {
          const filterType = cb.dataset.filterType;
          if (filterType) {
            cb.checked = !isAllSelected && selectedFilters.includes(filterType);
          }
        });
    });
  }

  async performSearch(): Promise<void> {
    const searchId = ++this.searchId;
    this.showLoading();

    try {
      // TODO: This should be split into a ContentGridController and a FilterableContentGridController
      // so that we don't have to do this weird join of searchParams and filtersValue.
      const searchParams: typeof this.searchParamsValue = { ...this.searchParamsValue };

      if (this.filtersValue.status && !this.filtersValue.status.includes("all")) {
        searchParams.status = this.filtersValue.status;
      }
      if (this.filtersValue.topics && !this.filtersValue.topics.includes("all")) {
        searchParams.topics = this.filtersValue.topics;
      }
      if (this.filtersValue.cuisine && !this.filtersValue.cuisine.includes("all")) {
        searchParams.cuisine = this.filtersValue.cuisine;
      }
      if (this.filtersValue.diet && !this.filtersValue.diet.includes("all")) {
        searchParams.diet = this.filtersValue.diet;
      }
      if (this.filtersValue.recipeType && !this.filtersValue.recipeType.includes("all")) {
        searchParams.recipeType = this.filtersValue.recipeType;
      }
      if (this.filtersValue.collections && !this.filtersValue.collections.includes("all")) {
        searchParams.collections = this.filtersValue.collections as ZendoCollectionId[];
      }

      // TODO: We should implement pagination and infinite scroll for optimal performance.
      const result = await actions.search(searchParams);

      if (searchId !== this.searchId) {
        return;
      }

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
      if (searchId !== this.searchId) {
        return;
      }
      console.error("Error fetching search results:", error);
      this.showError();
    } finally {
      if (searchId === this.searchId) {
        this.gridTarget.removeAttribute("aria-busy");
      }
    }
  }

  private renderCards(items: SearchResultResponse[]): void {
    this.gridTarget.innerHTML = "";

    items.forEach((item) => {
      const clone = this.cardTemplateTarget.content.cloneNode(true) as DocumentFragment;
      const cardElement = clone.firstElementChild as HTMLElement;

      cardElement.setAttribute("data-content-card-id-value", item.id);
      cardElement.setAttribute("data-content-card-collection-value", item.type);

      this.gridTarget.appendChild(cardElement);
    });
  }

  private showLoading(): void {
    this.gridTarget.setAttribute("aria-busy", "true");
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
