import type { ContentItem } from "./ContentItem";

/**
 * Command Palette - A keyboard-accessible search interface
 *
 * Features:
 * - Keyboard navigation (↑/↓, Enter, Esc)
 * - Keyboard shortcut (Cmd+K / Ctrl+K)
 * - Search with debouncing
 * - Visual status indicators
 * - Grouped search results
 */
export function initCommandPalette(): void {
  // ======== DOM Elements ========
  const elements = {
    commandPalette: document.getElementById("command-palette"),
    backdrop: document.getElementById("backdrop"),
    dialogPanel: document.getElementById("dialog-panel"),
    searchInput: document.getElementById(
      "search-input"
    ) as HTMLInputElement | null,
    resultsContainer: document.getElementById("results-container"),
    noResults: document.getElementById("no-results"),
  };

  // Validate all required elements exist
  if (Object.values(elements).some((element) => !element)) {
    console.error("Command palette elements not found");
    return;
  }

  // Type assertion after validation
  const { commandPalette, backdrop, dialogPanel, noResults, resultsContainer } =
    elements as Record<keyof typeof elements, HTMLElement>;

  // Handle searchInput separately with correct type
  const searchInput = elements.searchInput as HTMLInputElement;

  // ======== State ========
  type CommandPaletteState = {
    selectedIndex: number;
    filteredItems: ContentItem[];
    searchTimeout: number | null;
    isLoading: boolean;
  };

  const state: CommandPaletteState = {
    selectedIndex: -1,
    filteredItems: [],
    searchTimeout: null,
    isLoading: false,
  };

  // ======== Constants ========
  const ANIMATION_DURATION = 300; // ms
  const DEBOUNCE_DELAY = 300; // ms

  const STATUS_ICONS = {
    seedling: "🌱",
    budding: "🌿",
    evergreen: "🌳",
  } as const;

  const STATUS_COLORS = {
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
  } as const;

  // ======== UI Control Functions ========
  /**
   * Open the command palette and focus the search input
   */
  function openCommandPalette(): void {
    // Prevent scrolling of the page when command palette is open
    document.body.style.overflow = "hidden";

    // Make the command palette visible but keep elements in initial state
    commandPalette.classList.remove("hidden");

    // Ensure backdrop starts with opacity-0 if not already present
    backdrop.classList.add("opacity-0");

    // Force a reflow to ensure transitions work properly
    void backdrop.offsetWidth;

    // Start animations
    backdrop.classList.remove("opacity-0");

    // Small delay to ensure the transition works properly and create a staggered effect
    setTimeout(() => {
      dialogPanel.classList.remove("scale-95", "opacity-0");
      searchInput.focus();
    }, 50);
  }

  /**
   * Close the command palette and reset the search
   */
  function closeCommandPalette(): void {
    // Re-enable scrolling
    document.body.style.overflow = "";

    // Start animations
    backdrop.classList.add("opacity-0");
    dialogPanel.classList.add("scale-95", "opacity-0");

    // Wait for animations to complete before hiding
    // Use a slightly longer timeout to match the new duration-300 CSS
    setTimeout(() => {
      commandPalette.classList.add("hidden");
      searchInput.value = "";
      updateResults("");
      backdrop.classList.remove("opacity-0");
    }, ANIMATION_DURATION + 100);
  }

  // ======== Formatting Functions ========
  /**
   * Format a date for display
   */
  function formatDate(date?: Date): string {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Get HTML for a status badge
   */
  function getStatusBadge(
    status?: string,
    isSelected: boolean = false
  ): string {
    if (!status || !(status in STATUS_ICONS)) return "";

    const statusKey = status as keyof typeof STATUS_ICONS;
    const icon = STATUS_ICONS[statusKey];
    const colorClass = isSelected
      ? STATUS_COLORS[statusKey].selected
      : STATUS_COLORS[statusKey].default;

    return `<span class="text-xs px-2 py-0.5 rounded-full ${colorClass}">${icon} ${status}</span>`;
  }

  // ======== Search Functions ========
  /**
   * Fetch search results from the API
   */
  async function fetchSearchResults(query: string): Promise<ContentItem[]> {
    if (!query) return [];

    state.isLoading = true;

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching search results: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.items;
    } catch (error) {
      console.error("Error fetching search results:", error);
      return [];
    } finally {
      state.isLoading = false;
    }
  }

  /**
   * Update the results based on the search query with debouncing
   */
  function updateResults(query: string): void {
    // Reset state for empty query
    if (query === "") {
      state.filteredItems = [];
      resultsContainer.classList.add("hidden");
      noResults.classList.add("hidden");
      return;
    }

    // Don't search if query is less than 3 characters
    if (query.length < 3) {
      resultsContainer.innerHTML =
        '<div class="px-4 py-2 text-gray-500">Type at least 3 characters to search...</div>';
      resultsContainer.classList.remove("hidden");
      noResults.classList.add("hidden");
      return;
    }

    // Show loading state
    resultsContainer.innerHTML =
      '<div class="px-4 py-2 text-gray-500">Loading...</div>';
    resultsContainer.classList.remove("hidden");
    noResults.classList.add("hidden");

    // Debounce the search
    if (state.searchTimeout) {
      window.clearTimeout(state.searchTimeout);
    }

    state.searchTimeout = window.setTimeout(async () => {
      // Fetch results
      state.filteredItems = await fetchSearchResults(query);

      // Handle no results case
      if (state.filteredItems.length === 0) {
        resultsContainer.classList.add("hidden");
        noResults.classList.remove("hidden");
        return;
      }

      // Show results
      resultsContainer.classList.remove("hidden");
      noResults.classList.add("hidden");

      renderSearchResults();
    }, DEBOUNCE_DELAY);
  }

  /**
   * Render search results grouped by type
   */
  function renderSearchResults(): void {
    // Group items by type
    const groupedByType = state.filteredItems.reduce((groups, item) => {
      if (!groups.has(item.type)) {
        groups.set(item.type, []);
      }
      groups.get(item.type)!.push(item);
      return groups;
    }, new Map<string, ContentItem[]>());

    let html = "";
    let currentIndex = 0;

    // Generate HTML for each group
    groupedByType.forEach((items, type) => {
      html += `<div class="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase">${type}s</div>`;

      for (const item of items) {
        const isSelected = currentIndex === state.selectedIndex;
        html += `
          <a 
            href="${item.url}"
            class="block cursor-pointer px-4 py-2 select-none ${isSelected ? "bg-orange-600 text-white" : ""}" 
            data-index="${currentIndex}" 
            data-id="${item.id}"
          >
            <div class="flex justify-between items-center">
              <span>${item.name}</span>
              <div class="hidden sm:flex items-center gap-2">
                ${item.status ? getStatusBadge(item.status, isSelected) : ""}
                ${item.date ? `<span class="text-xs ${isSelected ? "text-orange-100" : "text-gray-400"}">${formatDate(item.date)}</span>` : ""}
              </div>
            </div>
          </a>
        `;
        currentIndex++;
      }
    });

    resultsContainer.innerHTML = html;
    addEventListenersToResults();
  }

  // ======== Navigation Functions ========
  /**
   * Add event listeners to result items
   */
  function addEventListenersToResults(): void {
    document.querySelectorAll("[data-index]").forEach((item) => {
      // Handle click
      item.addEventListener("click", () => {
        // The browser will handle navigation via the href attribute
        closeCommandPalette();
      });

      // Handle hover
      item.addEventListener("mouseenter", (e) => {
        const target = e.currentTarget as HTMLElement;
        state.selectedIndex = parseInt(target.dataset.index || "0");
        highlightSelected();
      });
    });
  }

  /**
   * Highlight the selected item
   */
  function highlightSelected(): void {
    document.querySelectorAll("[data-index]").forEach((element) => {
      const item = element as HTMLElement;
      const itemIndex = parseInt(item.dataset.index || "0");
      const isSelected = itemIndex === state.selectedIndex;
      const currentItem = state.filteredItems[itemIndex];

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
        const status = currentItem.status as keyof typeof STATUS_COLORS;
        const colorClass = isSelected
          ? STATUS_COLORS[status].selected
          : STATUS_COLORS[status].default;

        statusBadge.className = `text-xs px-2 py-0.5 rounded-full ${colorClass}`;
      }
    });
  }

  /**
   * Select an item and navigate to its URL
   */
  function selectItem(item: ContentItem): void {
    window.location.href = item.url;
    closeCommandPalette();
  }

  // ======== Event Handlers ========
  /**
   * Handle document clicks to close the palette when clicking outside
   */
  const handleDocumentClick = (e: MouseEvent) => {
    // Only process if command palette is visible
    if (commandPalette.classList.contains("hidden")) {
      return;
    }

    const target = e.target as Node;

    // Close if click is outside the dialog panel
    if (!dialogPanel.contains(target) && document.contains(target)) {
      closeCommandPalette();
    }
  };

  /**
   * Handle keyboard navigation in search results
   */
  const handleSearchKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        closeCommandPalette();
        break;

      case "ArrowDown":
        e.preventDefault();
        state.selectedIndex = Math.min(
          state.selectedIndex + 1,
          state.filteredItems.length - 1
        );

        // Initialize selection if none exists
        if (state.selectedIndex === -1 && state.filteredItems.length > 0) {
          state.selectedIndex = 0;
        }

        highlightSelected();
        break;

      case "ArrowUp":
        e.preventDefault();
        state.selectedIndex = Math.max(state.selectedIndex - 1, 0);
        highlightSelected();
        break;

      case "Enter":
        e.preventDefault();
        if (
          state.selectedIndex >= 0 &&
          state.selectedIndex < state.filteredItems.length
        ) {
          const item = state.filteredItems[state.selectedIndex];
          if (item) {
            selectItem(item);
          }
        }
        break;
    }
  };

  /**
   * Handle global keyboard shortcut (Cmd+K or Ctrl+K)
   */
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();

      if (commandPalette.classList.contains("hidden")) {
        openCommandPalette();
      } else {
        closeCommandPalette();
      }
    }
  };

  // ======== Initialize ========
  // Set up event listeners
  document.removeEventListener("click", handleDocumentClick);
  document.addEventListener("click", handleDocumentClick);

  searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value;
    state.selectedIndex = -1;
    updateResults(query);
  });

  searchInput.addEventListener("keydown", handleSearchKeydown);
  document.addEventListener("keydown", handleGlobalKeydown);

  // Add event listeners to command palette toggle elements
  document
    .querySelectorAll("[data-js-command-palette-toggle]")
    .forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCommandPalette();
      });
    });
}
