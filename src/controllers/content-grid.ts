import { Controller } from "@hotwired/stimulus";
import { actions } from "astro:actions";
import type { ZendoCollectionId } from "src/garden";

interface Filters {
  [category: string]: string[];
}

/** Filter categories the search action understands, in the order they're applied. */
const SEARCH_CATEGORIES = ["status", "topics", "cuisine", "diet", "recipeType", "collections"] as const;

/**
 * A grid of cards whose first page is rendered on the server. The client only
 * takes over to filter (via the search action) and to page ("Show more"); new
 * cards are fetched one by one as prerendered HTML by the content-card
 * controller.
 */
export default class ContentGridController extends Controller {
  static override targets = [
    "grid",
    "status",
    "more",
    "moreButton",
    "noMatchesTemplate",
    "errorTemplate",
    "checkbox",
    "allCheckbox",
    "filterButton",
    "filterValue",
  ];
  static override values = {
    searchParams: { type: Object, default: {} },
    filters: { type: Object, default: {} },
    // Every entry in the unfiltered list, as "collection/id", in display order.
    items: { type: Array, default: [] },
    pageSize: { type: Number, default: 24 },
    // How many items the grid currently shows (the server renders the first page).
    rendered: { type: Number, default: 0 },
  };

  declare readonly gridTarget: HTMLElement;
  declare readonly statusTarget: HTMLElement;
  declare readonly moreTarget: HTMLElement;
  declare readonly moreButtonTarget: HTMLButtonElement;
  declare readonly noMatchesTemplateTarget: HTMLTemplateElement;
  declare readonly errorTemplateTarget: HTMLTemplateElement;
  declare readonly checkboxTargets: HTMLInputElement[];
  declare readonly allCheckboxTargets: HTMLInputElement[];
  declare readonly filterButtonTargets: HTMLElement[];
  declare readonly filterValueTargets: HTMLElement[];
  declare searchParamsValue: Record<string, unknown>;
  declare filtersValue: Filters;
  declare itemsValue: string[];
  declare pageSizeValue: number;
  declare renderedValue: number;

  // The list currently being paged through: all items, or the filtered subset.
  private visibleItems: string[] = [];

  // Incremented per search so a slow, superseded response never overwrites a newer one.
  private searchId = 0;

  override connect(): void {
    this.visibleItems = this.itemsValue;
    this.readFiltersFromUrl();
    this.updateCheckboxStates();

    // The server rendered the unfiltered list; only search if the URL asks for a filtered one.
    if (this.hasActiveFilters()) {
      this.performSearch();
    } else {
      this.updateMoreButton();
    }
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

  clearFilters(): void {
    const cleared: Filters = {};
    for (const category of Object.keys(this.filtersValue)) {
      cleared[category] = ["all"];
    }
    this.filtersValue = cleared;

    this.updateCheckboxStates();
    this.writeFiltersToUrl();
    this.performSearch();
  }

  loadMore(): void {
    const start = this.renderedValue;
    const next = this.visibleItems.slice(start, start + this.pageSizeValue);
    if (next.length === 0) return;

    const firstNew = this.appendCards(next);
    this.renderedValue = start + next.length;
    this.updateMoreButton();
    this.announce(`Showing ${this.renderedValue} of ${this.visibleItems.length}`);

    // The button stays put below the new cards, so focus stays on it; once it
    // hides (last page), hand focus to the first new card instead of <body>.
    if (this.renderedValue >= this.visibleItems.length) {
      firstNew?.focus({ preventScroll: true });
    }
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

  private hasActiveFilters(): boolean {
    return Object.values(this.filtersValue).some((selected) => !selected.includes("all"));
  }

  /** Shows the selection in each filter's button: "Topic: Strategy" or "Topic: 2 selected". */
  private updateFilterValues(): void {
    for (const target of this.filterValueTargets) {
      const category = target.dataset.filterCategory;
      const selected = (category && this.filtersValue[category]) || ["all"];
      const isFiltered = !selected.includes("all");

      let text = "";
      if (isFiltered && selected.length === 1) {
        const checkbox = this.checkboxTargets.find(
          (cb) => cb.dataset.filterCategory === category && cb.dataset.filterType === selected[0]
        );
        text = `: ${checkbox?.dataset.filterLabel ?? selected[0]}`;
      } else if (isFiltered) {
        text = `: ${selected.length} selected`;
      }

      target.textContent = text;
    }

    for (const button of this.filterButtonTargets) {
      const category = button.dataset.filterCategory;
      const selected = (category && this.filtersValue[category]) || ["all"];
      button.toggleAttribute("data-active", !selected.includes("all"));
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
    this.updateFilterValues();

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
    this.gridTarget.setAttribute("aria-busy", "true");

    try {
      const items = this.hasActiveFilters() ? await this.searchFiltered() : this.itemsValue;

      if (searchId !== this.searchId) {
        return;
      }

      this.visibleItems = items;
      this.gridTarget.innerHTML = "";
      this.renderedValue = 0;

      if (items.length === 0) {
        this.gridTarget.appendChild(this.noMatchesTemplateTarget.content.cloneNode(true));
        this.updateMoreButton();
        this.announce("No matches");
        return;
      }

      const page = items.slice(0, this.pageSizeValue);
      this.appendCards(page);
      this.renderedValue = page.length;
      this.updateMoreButton();
      this.announce(items.length === 1 ? "1 result" : `${items.length} results`);
    } catch (error) {
      if (searchId !== this.searchId) {
        return;
      }
      console.error("Error fetching search results:", error);
      this.gridTarget.innerHTML = "";
      this.gridTarget.appendChild(this.errorTemplateTarget.content.cloneNode(true));
      this.visibleItems = [];
      this.renderedValue = 0;
      this.updateMoreButton();
    } finally {
      if (searchId === this.searchId) {
        this.gridTarget.removeAttribute("aria-busy");
      }
    }
  }

  /**
   * Runs the search action with the selected filters, returning matches in the
   * same order as the unfiltered list (filters only ever narrow it down).
   */
  private async searchFiltered(): Promise<string[]> {
    const searchParams: Record<string, unknown> = { ...this.searchParamsValue };
    delete searchParams.limit;

    for (const category of SEARCH_CATEGORIES) {
      const selected = this.filtersValue[category];
      if (selected && !selected.includes("all")) {
        searchParams[category] = category === "collections" ? (selected as ZendoCollectionId[]) : selected;
      }
    }

    const result = await actions.search(searchParams);
    if (result.error) {
      throw result.error;
    }

    const matches = new Set(result.data.items.map((item) => `${item.type}/${item.id}`));
    return this.itemsValue.filter((key) => matches.has(key));
  }

  /** Appends a loading slot per item; returns the first one. */
  private appendCards(keys: string[]): HTMLElement | null {
    let first: HTMLElement | null = null;

    for (const key of keys) {
      const [collection, ...idParts] = key.split("/");
      const slot = document.createElement("div");
      slot.className = "min-w-0 outline-none";
      slot.tabIndex = -1;
      slot.dataset.controller = "content-card";
      slot.dataset.contentCardCollectionValue = collection;
      slot.dataset.contentCardIdValue = idParts.join("/");
      this.gridTarget.appendChild(slot);
      first ??= slot;
    }

    return first;
  }

  private updateMoreButton(): void {
    const remaining = this.visibleItems.length - this.renderedValue;
    this.moreTarget.classList.toggle("hidden", remaining <= 0);
    if (remaining > 0) {
      this.moreButtonTarget.textContent = `Show ${Math.min(this.pageSizeValue, remaining)} more · ${remaining} left`;
    }
  }

  private announce(message: string): void {
    this.statusTarget.textContent = message;
  }
}
