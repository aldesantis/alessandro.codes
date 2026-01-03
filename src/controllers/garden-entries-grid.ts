import { Controller } from "@hotwired/stimulus";

interface FilterableValues {
  [category: string]: string | string[];
}

interface Filters {
  [category: string]: string[];
}

export default class GardenEntriesGridController extends Controller {
  static override targets = ["grid", "item", "checkbox", "allCheckbox"];
  static override values = {
    filterCategories: { type: Array, default: [] },
    filters: { type: Object, default: {} },
  };

  declare gridTarget: HTMLElement;
  declare itemTargets: HTMLElement[];
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
    this.updateVisibility();
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

    this.updateVisibility();
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

  private updateVisibility(): void {
    this.itemTargets.forEach((item) => {
      const isVisible = this.isItemVisible(item);
      item.classList.toggle("hidden", !isVisible);
    });
  }

  private isItemVisible(item: HTMLElement): boolean {
    const filterableValuesJson = item.getAttribute("data-filterable-values");
    if (!filterableValuesJson) {
      return false;
    }

    let filterableValues: FilterableValues;
    try {
      filterableValues = JSON.parse(filterableValuesJson) as FilterableValues;
    } catch {
      return false;
    }

    for (const category of this.filterCategoriesValue) {
      const selectedFilters = this.filtersValue[category] || ["all"];

      if (selectedFilters.includes("all")) {
        continue;
      }

      const entryValue = filterableValues[category];
      if (!entryValue) {
        return false;
      }

      let matches = false;
      if (Array.isArray(entryValue)) {
        matches = entryValue.length > 0 && entryValue.some((value) => selectedFilters.includes(value));
      } else {
        matches = selectedFilters.includes(entryValue);
      }

      if (!matches) {
        return false;
      }
    }

    return true;
  }
}
