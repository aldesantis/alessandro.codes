import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["grid", "item", "checkbox", "allCheckbox"];
  static values = {
    filterCategories: { type: Array, default: [] },
    filters: { type: Object, default: {} },
  };

  connect() {
    if (this.filterCategoriesValue.length > 0 && Object.keys(this.filtersValue).length === 0) {
      const initialFilters = {};

      this.filterCategoriesValue.forEach((category) => {
        initialFilters[category] = ["all"];
      });

      this.filtersValue = initialFilters;
    }
    this.updateVisibility();
  }

  filter(event) {
    const checkbox = event.currentTarget;
    const { filterType, filterCategory } = checkbox.dataset;
    const isChecked = checkbox.checked;

    if (filterType === "all") {
      this.handleAllFilter(filterCategory, isChecked, checkbox);
    } else {
      this.handleSpecificFilter(filterCategory, filterType, isChecked);
    }

    this.updateVisibility();
  }

  handleAllFilter(category, isChecked, checkbox) {
    if (isChecked) {
      this.filtersValue = { ...this.filtersValue, [category]: ["all"] };
      this.uncheckOtherCheckboxes(checkbox);
    } else {
      checkbox.checked = true; // Prevent unchecking "All" if it's the only one
    }
  }

  handleSpecificFilter(category, filterType, isChecked) {
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
      this.filtersValue = { ...this.filtersValue, [category]: newFilters.length ? newFilters : ["all"] };
      if (newFilters.length === 0 && allCheckbox) allCheckbox.checked = true;
    }
  }

  uncheckOtherCheckboxes(checkbox) {
    const { filterCategory } = checkbox.dataset;
    this.checkboxTargets
      .filter((cb) => cb.dataset.filterCategory === filterCategory && cb.dataset.filterType !== "all")
      .forEach((cb) => (cb.checked = false));
  }

  updateVisibility() {
    this.itemTargets.forEach((item) => {
      const isVisible = this.isItemVisible(item);
      item.classList.toggle("hidden", !isVisible);
    });
  }

  isItemVisible(item) {
    const filterableValuesJson = item.getAttribute("data-filterable-values");
    if (!filterableValuesJson) {
      return false;
    }

    let filterableValues;
    try {
      filterableValues = JSON.parse(filterableValuesJson);
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
