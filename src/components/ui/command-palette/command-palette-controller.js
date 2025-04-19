import { Controller } from "@hotwired/stimulus";

export default class CommandPaletteController extends Controller {
  static targets = ["palette", "backdrop", "dialog", "search", "results", "noResults", "groupTemplate", "itemTemplate"];

  // State
  selectedIndex = -1;
  filteredItems = [];
  searchTimeout = null;
  isLoading = false;

  // Constants
  ANIMATION_DURATION = 300; // ms
  DEBOUNCE_DELAY = 300; // ms

  STATUS_ICONS = {
    seedling: "🌱",
    budding: "🌿",
    evergreen: "🌳",
  };

  STATUS_COLORS = {
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

  connect() {
    // Set up event listeners
    document.addEventListener("click", this.handleDocumentClick.bind(this));
    this.searchTarget.addEventListener("input", this.handleSearchInput.bind(this));
    this.searchTarget.addEventListener("keydown", this.handleSearchKeydown.bind(this));
    document.addEventListener("keydown", this.handleGlobalKeydown.bind(this));

    // Add event listeners to command palette toggle elements
    document.querySelectorAll("[data-js-command-palette-toggle]").forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.open();
      });
    });
  }

  disconnect() {
    document.removeEventListener("click", this.handleDocumentClick.bind(this));
    this.searchTarget.removeEventListener("input", this.handleSearchInput.bind(this));
    this.searchTarget.removeEventListener("keydown", this.handleSearchKeydown.bind(this));
    document.removeEventListener("keydown", this.handleGlobalKeydown.bind(this));
  }

  // UI Control Methods
  open() {
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

  close() {
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
  formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  getStatusBadge(status, isSelected = false) {
    if (!status || !(status in this.STATUS_ICONS)) return "";

    const statusKey = status;
    const icon = this.STATUS_ICONS[statusKey];
    const colorClass = isSelected ? this.STATUS_COLORS[statusKey].selected : this.STATUS_COLORS[statusKey].default;

    return `<span class="text-xs px-2 py-0.5 rounded-full ${colorClass}">${icon} ${status}</span>`;
  }

  // Search Methods
  async fetchSearchResults(query) {
    if (!query) return [];

    this.isLoading = true;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`Error fetching search results: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching search results:", error);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  updateResults(query) {
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
    if (this.searchTimeout) {
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

  renderSearchResults() {
    // Group items by type
    const groupedByType = this.filteredItems.reduce((groups, item) => {
      if (!groups.has(item.type)) {
        groups.set(item.type, []);
      }
      groups.get(item.type).push(item);
      return groups;
    }, new Map());

    // Clear previous results
    this.resultsTarget.innerHTML = "";
    let currentIndex = 0;

    // Generate HTML for each group
    groupedByType.forEach((items, type) => {
      // Create group header
      const groupElement = this.groupTemplateTarget.content.cloneNode(true);
      groupElement.querySelector("div").textContent = `${type}s`;
      this.resultsTarget.appendChild(groupElement);

      // Create items for this group
      for (const item of items) {
        const isSelected = currentIndex === this.selectedIndex;
        const itemElement = this.itemTemplateTarget.content.cloneNode(true);
        const itemLink = itemElement.querySelector("a");

        // Set up the item link
        itemLink.href = item.url;
        itemLink.dataset.index = currentIndex;
        itemLink.dataset.id = item.id;
        if (isSelected) {
          itemLink.classList.add("bg-orange-600", "text-white");
        }

        // Set the item name
        itemLink.querySelector("span").textContent = item.name;

        // Set up status badge if present
        const statusBadge = itemLink.querySelector(".status-badge");
        if (item.status) {
          statusBadge.innerHTML = this.getStatusBadge(item.status, isSelected);
        } else {
          statusBadge.remove();
        }

        // Set up date if present
        const dateText = itemLink.querySelector(".date-text");
        if (item.date) {
          dateText.textContent = this.formatDate(item.date);
          dateText.classList.toggle("text-orange-100", isSelected);
          dateText.classList.toggle("text-gray-400", !isSelected);
        } else {
          dateText.remove();
        }

        this.resultsTarget.appendChild(itemElement);
        currentIndex++;
      }
    });

    this.addEventListenersToResults();
  }

  // Navigation Methods
  addEventListenersToResults() {
    this.resultsTarget.querySelectorAll("[data-index]").forEach((item) => {
      // Handle click
      item.addEventListener("click", () => {
        // The browser will handle navigation via the href attribute
        this.close();
      });

      // Handle hover
      item.addEventListener("mouseenter", (e) => {
        const target = e.currentTarget;
        this.selectedIndex = parseInt(target.dataset.index || "0");
        this.highlightSelected();
      });
    });
  }

  highlightSelected() {
    this.resultsTarget.querySelectorAll("[data-index]").forEach((element) => {
      const item = element;
      const itemIndex = parseInt(item.dataset.index || "0");
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
      const statusBadge = item.querySelector(".rounded-full");
      if (statusBadge && currentItem?.status) {
        const status = currentItem.status;
        const colorClass = isSelected ? this.STATUS_COLORS[status].selected : this.STATUS_COLORS[status].default;

        statusBadge.className = `text-xs px-2 py-0.5 rounded-full ${colorClass}`;
      }
    });
  }

  selectItem(item) {
    window.location.href = item.url;
    this.close();
  }

  // Event Handlers
  handleDocumentClick(e) {
    // Only process if command palette is visible
    if (this.paletteTarget.classList.contains("hidden")) {
      return;
    }

    const target = e.target;

    // Close if click is outside the dialog panel
    if (!this.dialogTarget.contains(target) && document.contains(target)) {
      this.close();
    }
  }

  handleSearchInput(e) {
    const query = e.target.value;
    this.selectedIndex = -1;
    this.updateResults(query);
  }

  handleSearchKeydown(e) {
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

  handleGlobalKeydown(e) {
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
