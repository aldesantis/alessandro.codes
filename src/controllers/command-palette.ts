import { Controller } from "@hotwired/stimulus";
import { actions } from "astro:actions";

interface ContentItem {
  id: string;
  name: string;
  url: string;
  type: string;
  date?: string;
  status?: "seedling" | "budding" | "evergreen";
}

type StatusType = "seedling" | "budding" | "evergreen";

interface StatusColors {
  selected: string;
  default: string;
}

export default class CommandPaletteController extends Controller {
  static override targets = [
    "palette",
    "backdrop",
    "dialog",
    "search",
    "results",
    "noResults",
    "groupTemplate",
    "itemTemplate",
  ];

  declare readonly paletteTarget: HTMLElement;
  declare readonly backdropTarget: HTMLElement;
  declare readonly dialogTarget: HTMLElement;
  declare readonly searchTarget: HTMLInputElement;
  declare readonly resultsTarget: HTMLElement;
  declare readonly noResultsTarget: HTMLElement;
  declare readonly groupTemplateTarget: HTMLTemplateElement;
  declare readonly itemTemplateTarget: HTMLTemplateElement;

  // State
  selectedIndex: number = -1;
  filteredItems: ContentItem[] = [];
  searchTimeout: number | null = null;
  isLoading: boolean = false;

  // Constants
  readonly ANIMATION_DURATION: number = 300; // ms
  readonly DEBOUNCE_DELAY: number = 300; // ms

  readonly STATUS_ICONS: Record<StatusType, string> = {
    seedling: "🌱",
    budding: "🌿",
    evergreen: "🌳",
  };

  readonly STATUS_COLORS: Record<StatusType, StatusColors> = {
    seedling: {
      selected: "bg-green-700 text-white",
      default: "bg-green-100 text-green-800",
    },
    budding: {
      selected: "bg-yellow-700 text-white",
      default: "bg-yellow-100 text-yellow-800",
    },
    evergreen: {
      selected: "bg-blue-700 text-white",
      default: "bg-blue-100 text-blue-800",
    },
  };

  override connect(): void {
    // Set up event listeners
    document.addEventListener("click", this.handleDocumentClick.bind(this));
    this.searchTarget.addEventListener("input", this.handleSearchInput.bind(this));
    this.searchTarget.addEventListener("keydown", this.handleSearchKeydown.bind(this));
    document.addEventListener("keydown", this.handleGlobalKeydown.bind(this));

    // Add event listeners to command palette toggle elements
    document.querySelectorAll<HTMLElement>("[data-js-command-palette-toggle]").forEach((element) => {
      element.addEventListener("click", (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.open();
      });
    });
  }

  override disconnect(): void {
    document.removeEventListener("click", this.handleDocumentClick.bind(this));
    this.searchTarget.removeEventListener("input", this.handleSearchInput.bind(this));
    this.searchTarget.removeEventListener("keydown", this.handleSearchKeydown.bind(this));
    document.removeEventListener("keydown", this.handleGlobalKeydown.bind(this));
  }

  // UI Control Methods
  open(): void {
    // Prevent scrolling of the page when command palette is open
    document.body.style.overflow = "hidden";

    // Make the command palette visible but keep elements in initial state
    this.paletteTarget.classList.remove("hidden");

    // Ensure backdrop starts with opacity-0 if not already present
    this.backdropTarget.classList.add("opacity-0");

    // Force a reflow to ensure transitions work properly
    void this.backdropTarget.offsetWidth;

    // Start animations
    this.backdropTarget.classList.remove("opacity-0");

    // Small delay to ensure the transition works properly and create a staggered effect
    setTimeout(() => {
      this.dialogTarget.classList.remove("scale-95", "opacity-0");
      this.searchTarget.focus();
    }, 50);
  }

  close(): void {
    // Re-enable scrolling
    document.body.style.overflow = "";

    // Start animations
    this.backdropTarget.classList.add("opacity-0");
    this.dialogTarget.classList.add("scale-95", "opacity-0");

    // Wait for animations to complete before hiding
    setTimeout(() => {
      this.paletteTarget.classList.add("hidden");
      this.searchTarget.value = "";
      this.updateResults("");
      this.backdropTarget.classList.remove("opacity-0");
    }, this.ANIMATION_DURATION + 100);
  }

  // Formatting Methods
  formatDate(date: string | undefined): string {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getStatusBadge(status: StatusType | undefined, isSelected: boolean = false): string {
    if (!status || !(status in this.STATUS_ICONS)) return "";

    const statusKey = status as StatusType;
    const icon = this.STATUS_ICONS[statusKey];
    const colorClass = isSelected ? this.STATUS_COLORS[statusKey].selected : this.STATUS_COLORS[statusKey].default;

    return `<span class="text-xs px-2 py-0.5 rounded-full ${colorClass}">${icon} ${status}</span>`;
  }

  // Search Methods
  async fetchSearchResults(query: string): Promise<ContentItem[]> {
    if (!query) return [];

    this.isLoading = true;

    try {
      const result = await actions.search({ query });

      if (result.error) {
        console.error("Error fetching search results:", result.error);
        return [];
      }

      return result.data.items;
    } catch (error) {
      console.error("Error fetching search results:", error);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  updateResults(query: string): void {
    // Reset state for empty query
    if (query === "") {
      this.filteredItems = [];
      this.resultsTarget.classList.add("hidden");
      this.noResultsTarget.classList.add("hidden");
      return;
    }

    // Don't search if query is less than 3 characters
    if (query.length < 3) {
      this.resultsTarget.innerHTML =
        '<div class="px-4 py-2 text-gray-500">Type at least 3 characters to search...</div>';
      this.resultsTarget.classList.remove("hidden");
      this.noResultsTarget.classList.add("hidden");
      return;
    }

    // Show loading state
    this.resultsTarget.innerHTML = '<div class="px-4 py-2 text-gray-500">Loading...</div>';
    this.resultsTarget.classList.remove("hidden");
    this.noResultsTarget.classList.add("hidden");

    // Debounce the search
    if (this.searchTimeout !== null) {
      window.clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(async () => {
      // Fetch results
      this.filteredItems = await this.fetchSearchResults(query);

      // Handle no results case
      if (this.filteredItems.length === 0) {
        this.resultsTarget.classList.add("hidden");
        this.noResultsTarget.classList.remove("hidden");
        return;
      }

      // Show results
      this.resultsTarget.classList.remove("hidden");
      this.noResultsTarget.classList.add("hidden");

      this.renderSearchResults();
    }, this.DEBOUNCE_DELAY);
  }

  renderSearchResults(): void {
    // Group items by type
    const groupedByType = this.filteredItems.reduce((groups, item) => {
      if (!groups.has(item.type)) {
        groups.set(item.type, []);
      }
      groups.get(item.type)!.push(item);
      return groups;
    }, new Map<string, ContentItem[]>());

    // Clear previous results
    this.resultsTarget.innerHTML = "";
    let currentIndex = 0;

    // Generate HTML for each group
    groupedByType.forEach((items, type) => {
      // Create group header
      const groupElement = this.groupTemplateTarget.content.cloneNode(true) as DocumentFragment;
      const groupDiv = groupElement.querySelector("div");
      if (groupDiv) {
        groupDiv.textContent = `${type}s`;
      }
      this.resultsTarget.appendChild(groupElement);

      // Create items for this group
      for (const item of items) {
        const isSelected = currentIndex === this.selectedIndex;
        const itemElement = this.itemTemplateTarget.content.cloneNode(true) as DocumentFragment;
        const itemLink = itemElement.querySelector<HTMLAnchorElement>("a");
        if (!itemLink) continue;

        // Set up the item link
        itemLink.href = item.url;
        itemLink.dataset.index = currentIndex.toString();
        itemLink.dataset.id = item.id;
        if (isSelected) {
          itemLink.classList.add("bg-orange-600", "text-white");
        }

        // Set the item name
        const nameSpan = itemLink.querySelector("span");
        if (nameSpan) {
          nameSpan.textContent = item.name;
        }

        // Set up status badge if present
        const statusBadge = itemLink.querySelector<HTMLElement>(".status-badge");
        if (item.status && statusBadge) {
          statusBadge.innerHTML = this.getStatusBadge(item.status, isSelected);
        } else if (statusBadge) {
          statusBadge.remove();
        }

        // Set up date if present
        const dateText = itemLink.querySelector<HTMLElement>(".date-text");
        if (item.date && dateText) {
          dateText.textContent = this.formatDate(item.date);
          dateText.classList.toggle("text-orange-100", isSelected);
          dateText.classList.toggle("text-gray-400", !isSelected);
        } else if (dateText) {
          dateText.remove();
        }

        this.resultsTarget.appendChild(itemElement);
        currentIndex++;
      }
    });

    this.addEventListenersToResults();
  }

  // Navigation Methods
  addEventListenersToResults(): void {
    this.resultsTarget.querySelectorAll<HTMLElement>("[data-index]").forEach((item) => {
      // Handle click
      item.addEventListener("click", () => {
        // The browser will handle navigation via the href attribute
        this.close();
      });

      // Handle hover
      item.addEventListener("mouseenter", (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        this.selectedIndex = parseInt(target.dataset.index || "0", 10);
        this.highlightSelected();
      });
    });
  }

  highlightSelected(): void {
    this.resultsTarget.querySelectorAll<HTMLElement>("[data-index]").forEach((element) => {
      const item = element;
      const itemIndex = parseInt(item.dataset.index || "0", 10);
      const isSelected = itemIndex === this.selectedIndex;
      const currentItem = this.filteredItems[itemIndex];

      // Toggle main item highlight
      if (isSelected) {
        item.classList.add("bg-orange-600", "text-white");
      } else {
        item.classList.remove("bg-orange-600", "text-white");
      }

      // Update date text color if present
      const dateSpan = item.querySelector("span:last-child");
      if (dateSpan) {
        dateSpan.classList.toggle("text-orange-100", isSelected);
        dateSpan.classList.toggle("text-gray-400", !isSelected);
      }

      // Update status badge if present
      const statusBadge = item.querySelector<HTMLElement>(".rounded-full");
      if (statusBadge && currentItem?.status) {
        const status = currentItem.status as StatusType;
        const colorClass = isSelected ? this.STATUS_COLORS[status].selected : this.STATUS_COLORS[status].default;

        statusBadge.className = `text-xs px-2 py-0.5 rounded-full ${colorClass}`;
      }
    });
  }

  selectItem(item: ContentItem): void {
    window.location.href = item.url;
    this.close();
  }

  // Event Handlers
  handleDocumentClick(e: MouseEvent): void {
    // Only process if command palette is visible
    if (this.paletteTarget.classList.contains("hidden")) {
      return;
    }

    const target = e.target as Node;

    // Close if click is outside the dialog panel
    if (!this.dialogTarget.contains(target) && document.contains(target)) {
      this.close();
    }
  }

  handleSearchInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    const query = target.value;
    this.selectedIndex = -1;
    this.updateResults(query);
  }

  handleSearchKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case "Escape":
        this.close();
        break;

      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);

        // Initialize selection if none exists
        if (this.selectedIndex === -1 && this.filteredItems.length > 0) {
          this.selectedIndex = 0;
        }

        this.highlightSelected();
        break;

      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.highlightSelected();
        break;

      case "Enter":
        e.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredItems.length) {
          const item = this.filteredItems[this.selectedIndex];
          if (item) {
            this.selectItem(item);
          }
        }
        break;
    }
  }

  handleGlobalKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();

      if (this.paletteTarget.classList.contains("hidden")) {
        this.open();
      } else {
        this.close();
      }
    }
  }
}
