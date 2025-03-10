import type { ContentItem } from "./ContentItem";

/**
 * Initialize the command palette
 */
export function initCommandPalette(): void {
  // Get DOM elements
  const commandPalette = document.getElementById("command-palette")!;
  const backdrop = document.getElementById("backdrop")!;
  const dialogPanel = document.getElementById("dialog-panel")!;
  const searchInput = document.getElementById(
    "search-input"
  ) as HTMLInputElement;
  const resultsContainer = document.getElementById("results-container")!;
  const noResults = document.getElementById("no-results")!;

  // Check if all elements exist
  if (
    !commandPalette ||
    !backdrop ||
    !dialogPanel ||
    !searchInput ||
    !resultsContainer ||
    !noResults
  ) {
    console.error("Command palette elements not found");
    return;
  }

  // State variables
  let selectedIndex = -1;
  let filteredItems: ContentItem[] = [];
  let searchTimeout: number | null = null;
  let isLoading = false;

  /**
   * Open the command palette
   */
  function openCommandPalette(): void {
    // Prevent scrolling of the page when command palette is open
    document.body.style.overflow = "hidden";

    commandPalette.classList.remove("hidden");
    setTimeout(() => {
      dialogPanel.classList.remove("scale-95", "opacity-0");
      searchInput.focus();
    }, 10);
  }

  /**
   * Close the command palette
   */
  function closeCommandPalette(): void {
    // Re-enable scrolling when command palette is closed
    document.body.style.overflow = "";

    dialogPanel.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      commandPalette.classList.add("hidden");
      searchInput.value = "";
      updateResults("");
    }, 200);
  }

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
   * Get status badge for notes
   */
  function getStatusBadge(
    status?: string,
    isSelected: boolean = false
  ): string {
    if (!status) return "";

    const statusIcons = {
      seedling: "🌱",
      budding: "🌿",
      evergreen: "🌳",
    };

    const statusColors = {
      seedling: isSelected
        ? "bg-green-700 text-white"
        : "bg-green-100 text-green-800",
      budding: isSelected
        ? "bg-yellow-700 text-white"
        : "bg-yellow-100 text-yellow-800",
      evergreen: isSelected
        ? "bg-blue-700 text-white"
        : "bg-blue-100 text-blue-800",
    };

    const icon = statusIcons[status as keyof typeof statusIcons] || "";
    const color = statusColors[status as keyof typeof statusColors] || "";
    return `<span class="text-xs px-2 py-0.5 rounded-full ${color}">${icon} ${status}</span>`;
  }

  /**
   * Fetch search results from the API
   */
  async function fetchSearchResults(query: string): Promise<ContentItem[]> {
    if (!query) return [];

    isLoading = true;
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
      isLoading = false;
    }
  }

  /**
   * Update the results based on the search query
   */
  function updateResults(query: string): void {
    if (query === "") {
      filteredItems = [];
      resultsContainer.classList.add("hidden");
      noResults.classList.add("hidden");
      return;
    }

    // Show loading state
    resultsContainer.innerHTML =
      '<div class="px-4 py-2 text-gray-500">Loading...</div>';
    resultsContainer.classList.remove("hidden");
    noResults.classList.add("hidden");

    // Debounce the search to avoid too many API calls
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }

    searchTimeout = window.setTimeout(async () => {
      // Fetch results from API
      filteredItems = await fetchSearchResults(query);

      if (filteredItems.length === 0) {
        resultsContainer.classList.add("hidden");
        noResults.classList.remove("hidden");
        return;
      }

      resultsContainer.classList.remove("hidden");
      noResults.classList.add("hidden");

      // Group items by type
      const groupedByType = new Map<string, ContentItem[]>();

      // Group the items by type
      for (const item of filteredItems) {
        if (!groupedByType.has(item.type)) {
          groupedByType.set(item.type, []);
        }

        const typeItems = groupedByType.get(item.type);
        if (typeItems) {
          typeItems.push(item);
        }
      }

      let html = "";
      let currentIndex = 0;

      groupedByType.forEach((items, type) => {
        html += `<div class="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase">${type}s</div>`;

        for (const item of items) {
          const isSelected = currentIndex === selectedIndex;
          html += `
            <a 
              href="${item.url}"
              class="block cursor-pointer px-4 py-2 select-none ${isSelected ? "bg-orange-600 text-white" : ""}" 
              data-index="${currentIndex}" 
              data-id="${item.id}"
            >
              <div class="flex justify-between items-center">
                <span>${item.name}</span>
                <div class="flex items-center gap-2">
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
    }, 300); // 300ms debounce
  }

  /**
   * Add event listeners to result items
   */
  function addEventListenersToResults(): void {
    document.querySelectorAll("[data-index]").forEach((item) => {
      item.addEventListener("click", (e) => {
        // Close the command palette when an item is clicked
        // The browser will handle the navigation via the href attribute
        closeCommandPalette();
      });

      item.addEventListener("mouseenter", (e) => {
        const target = e.currentTarget as HTMLElement;
        selectedIndex = parseInt(target.dataset.index || "0");
        highlightSelected();
      });
    });
  }

  /**
   * Highlight the selected item
   */
  function highlightSelected(): void {
    document.querySelectorAll("[data-index]").forEach((item) => {
      const element = item as HTMLElement;
      const itemIndex = parseInt(element.dataset.index || "0");
      const currentItem = filteredItems[itemIndex];

      if (itemIndex === selectedIndex) {
        element.classList.add("bg-orange-600", "text-white");
        // Also update text color for date
        const dateSpan = element.querySelector("span:last-child");
        if (dateSpan) {
          dateSpan.classList.remove("text-gray-400");
          dateSpan.classList.add("text-orange-100");
        }

        // Update status badge if present
        const statusBadge = element.querySelector(".rounded-full");
        if (statusBadge && currentItem?.status) {
          // Remove old classes and add selected classes
          statusBadge.className = `text-xs px-2 py-0.5 rounded-full ${
            currentItem.status === "seedling"
              ? "bg-green-700 text-white"
              : currentItem.status === "budding"
                ? "bg-yellow-700 text-white"
                : currentItem.status === "evergreen"
                  ? "bg-blue-700 text-white"
                  : ""
          }`;
        }
      } else {
        element.classList.remove("bg-orange-600", "text-white");
        // Reset text color for date
        const dateSpan = element.querySelector("span:last-child");
        if (dateSpan) {
          dateSpan.classList.remove("text-orange-100");
          dateSpan.classList.add("text-gray-400");
        }

        // Reset status badge if present
        const statusBadge = element.querySelector(".rounded-full");
        if (statusBadge && currentItem?.status) {
          // Remove selected classes and add normal classes
          statusBadge.className = `text-xs px-2 py-0.5 rounded-full ${
            currentItem.status === "seedling"
              ? "bg-green-100 text-green-800"
              : currentItem.status === "budding"
                ? "bg-yellow-100 text-yellow-800"
                : currentItem.status === "evergreen"
                  ? "bg-blue-100 text-blue-800"
                  : ""
          }`;
        }
      }
    });
  }

  /**
   * Select an item and navigate to its URL
   */
  function selectItem(item: ContentItem): void {
    // Use window.location for keyboard navigation
    window.location.href = item.url;
    closeCommandPalette();
  }

  // Event listener for search input
  searchInput.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    const query = target.value;
    selectedIndex = -1;
    updateResults(query);
  });

  // Event listener for keyboard navigation
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCommandPalette();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
      if (selectedIndex === -1 && filteredItems.length > 0) {
        selectedIndex = 0;
      }
      highlightSelected();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlightSelected();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
        const item = filteredItems[selectedIndex];
        if (item) {
          selectItem(item);
        }
      }
    }
  });

  // Event listener for backdrop click
  backdrop.addEventListener("click", (e) => {
    // Make sure the click was directly on the backdrop
    if (e.target === backdrop) {
      closeCommandPalette();
    }
  });

  // Prevent clicks on the dialog panel from closing the palette
  dialogPanel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Event listener for keyboard shortcut (Cmd+K or Ctrl+K)
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      if (commandPalette.classList.contains("hidden")) {
        openCommandPalette();
      } else {
        closeCommandPalette();
      }
    }
  });
}
