import { Controller } from "@hotwired/stimulus";

interface Filters {
  [category: string]: string[];
}

export default class GardenFiltersController extends Controller {
  static override targets = ["checkbox", "allCheckbox"];
  static override values = {
    filterCategories: { type: Array, default: [] },
    filters: { type: Object, default: {} },
  };

  declare checkboxTargets: HTMLInputElement[];
  declare allCheckboxTargets: HTMLInputElement[];
  declare filterCategoriesValue: string[];
  declare filtersValue: Filters;

  override connect(): void {
    if (this.filterCategoriesValue.length > 0 && Object.keys(this.filtersValue).length === 0) {
      const initialFilters: Filters = {};

      this.filterCategoriesValue.forEach((category) => {
        initialFilters[category] = ["all"];
      });

      this.filtersValue = initialFilters;
    }
  }

  override disconnect(): void {
    // No cleanup needed
  }

  filter(event: Event): void {
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

    // Dispatch event to notify grid controller of filter changes
    this.dispatchFiltersChanged();
  }

  private handleAllFilter(category: string, isChecked: boolean, checkbox: HTMLInputElement): void {
    if (isChecked) {
      this.filtersValue = { ...this.filtersValue, [category]: ["all"] };
      this.uncheckOtherCheckboxes(checkbox);
    } else {
      checkbox.checked = true; // Prevent unchecking "All" if it's the only one
    }
  }

  private handleSpecificFilter(category: string, filterType: string, isChecked: boolean): void {
    const currentFilters = this.filtersValue[category] || ["all"];
    const allCheckbox = this.allCheckboxTargets.find((cb) => cb.dataset.filterCategory === category);

    if (isChecked) {
      // Remove 'all' and add the new filter
      const newFilters = currentFilters.filter((f) => f !== "all");
      this.filtersValue = { ...this.filtersValue, [category]: [...newFilters, filterType] };
      if (allCheckbox) allCheckbox.checked = false;
    } else {
      // Remove the filter
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

  private dispatchFiltersChanged(): void {
    // Extract filter parameters from current filter state
    const statuses =
      this.filtersValue.status && !this.filtersValue.status.includes("all") ? this.filtersValue.status : undefined;

    const topics =
      this.filtersValue.topics && !this.filtersValue.topics.includes("all") ? this.filtersValue.topics : undefined;

    const types =
      this.filtersValue.types && !this.filtersValue.types.includes("all") ? this.filtersValue.types : undefined;

    // Dispatch custom event with filter data
    const event = new CustomEvent("filters:changed", {
      detail: { filters: this.filtersValue, statuses, topics, types },
      bubbles: true,
    });
    this.element.dispatchEvent(event);
  }
}
