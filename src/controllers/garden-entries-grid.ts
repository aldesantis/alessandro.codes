import { Controller } from "@hotwired/stimulus";
import { actions } from "astro:actions";
import type { GardenEntryTypeId } from "src/lib/garden/entries";

interface FiltersChangedEventDetail {
  filters: { [category: string]: string[] };
  statuses?: string[];
  topics?: string[];
  types?: string[];
}

export default class GardenEntriesGridController extends Controller {
  static override targets = ["grid", "item"];
  static override values = {
    entryTypes: { type: Array, default: [] },
    layoutType: { type: String, default: "grid" },
    itemSize: { type: String, default: "M" },
  };

  declare gridTarget: HTMLElement;
  declare itemTargets: HTMLElement[];
  declare entryTypesValue: GardenEntryTypeId[];
  declare layoutTypeValue: string;
  declare itemSizeValue: string;

  private filtersChangedHandler = this.handleFiltersChanged.bind(this);

  override connect(): void {
    // Listen for filter change events from garden-filters controller
    this.element.addEventListener("filters:changed", this.filtersChangedHandler);

    // Load entries when the controller connects
    this.loadEntries();
  }

  override disconnect(): void {
    this.element.removeEventListener("filters:changed", this.filtersChangedHandler);
  }

  private handleFiltersChanged(event: Event): void {
    const customEvent = event as CustomEvent<FiltersChangedEventDetail>;
    const { statuses, topics, types } = customEvent.detail;

    // Load entries with updated filters
    this.loadEntries({ statuses, topics, types });
  }

  private getItemClass(): string {
    return this.layoutTypeValue === "grid" ? "mb-4" : "mb-4 break-inside-avoid";
  }

  private async loadEntries(filterParams?: {
    statuses?: string[];
    topics?: string[];
    types?: string[];
  }): Promise<void> {
    try {
      const statuses = filterParams?.statuses;
      const topics = filterParams?.topics;
      // If types filter is provided, use it; otherwise use the prop entryTypes
      const finalEntryTypes =
        filterParams?.types && filterParams.types.length > 0 && !filterParams.types.includes("all")
          ? (filterParams.types as GardenEntryTypeId[])
          : this.entryTypesValue;

      const result = await actions.search({
        query: "",
        entryTypes: finalEntryTypes,
        statuses,
        topics,
      });

      if (result.error) {
        console.error("Error fetching entries:", result.error);
        this.gridTarget.innerHTML = `
          <div class="col-span-full flex items-center justify-center p-8">
            <div class="text-red-500 dark:text-red-400">Failed to load entries. Please try again later.</div>
          </div>
        `;
        return;
      }

      const items = result.data?.items || [];

      if (items.length === 0) {
        this.gridTarget.innerHTML = `
          <div class="col-span-full flex items-center justify-center p-8">
            <p class="text-gray-500 dark:text-gray-400">Nothing here yet! Check back soon.</p>
          </div>
        `;
        return;
      }

      // Create document fragment for better performance
      const fragment = document.createDocumentFragment();

      items.forEach((item: { id: string; type: string }) => {
        const div = document.createElement("div");
        div.className = this.getItemClass();
        div.setAttribute("data-garden-entries-grid-target", "item");
        div.setAttribute("data-controller", "garden-lazy-card");
        div.setAttribute("data-garden-lazy-card-entry-id-value", item.id);
        div.setAttribute("data-garden-lazy-card-entry-collection-value", item.type);
        fragment.appendChild(div);
      });

      this.gridTarget.innerHTML = "";
      this.gridTarget.appendChild(fragment);

      // Trigger Stimulus to connect new controllers
      // Stimulus should automatically connect, but we dispatch an event to ensure
      const connectEvent = new CustomEvent("stimulus:connect", { bubbles: true });
      this.gridTarget.dispatchEvent(connectEvent);

      // Also try to manually load if Stimulus application is available
      // Wait a bit for the DOM to settle
      setTimeout(() => {
        interface StimulusWindow {
          Stimulus?: {
            application?: {
              load: () => void;
            };
          };
        }
        const application = (window as unknown as StimulusWindow).Stimulus?.application;
        if (application) {
          application.load();
        }
      }, 0);
    } catch (error) {
      console.error("Error loading entries:", error);
      this.gridTarget.innerHTML = `
        <div class="col-span-full flex items-center justify-center p-8">
          <div class="text-red-500 dark:text-red-400">Failed to load entries. Please try again later.</div>
        </div>
      `;
    }
  }
}
