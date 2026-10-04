import { Controller } from "@hotwired/stimulus";
import { actions } from "astro:actions";
import type { SearchResult } from "zendo";

type StatusType = "seedling" | "budding" | "evergreen";

type SearchResultResponse = SearchResult & {
  url: string;
  status?: StatusType;
};

type FetchOutcome = { ok: true; items: SearchResultResponse[] } | { ok: false };

interface StatusColors {
  selected: string;
  default: string;
}

const OPTION_ID_PREFIX = "command-palette-option-";
const HIDDEN_STATE_CLASSES = {
  backdrop: ["opacity-0"],
  panel: ["opacity-0", "scale-[0.97]"],
};

export default class CommandPaletteController extends Controller<HTMLDialogElement> {
  static override targets = [
    "dialog",
    "backdrop",
    "panel",
    "search",
    "results",
    "status",
    "groupTemplate",
    "itemTemplate",
  ];

  declare readonly dialogTarget: HTMLDialogElement;
  declare readonly backdropTarget: HTMLElement;
  declare readonly panelTarget: HTMLElement;
  declare readonly searchTarget: HTMLInputElement;
  declare readonly resultsTarget: HTMLElement;
  declare readonly statusTarget: HTMLElement;
  declare readonly groupTemplateTarget: HTMLTemplateElement;
  declare readonly itemTemplateTarget: HTMLTemplateElement;

  // State
  selectedIndex: number = -1;
  filteredItems: SearchResultResponse[] = [];
  searchTimeout: number | null = null;
  closeTimeout: number | null = null;
  requestId: number = 0;
  returnFocusTo: HTMLElement | null = null;

  // Constants
  readonly ANIMATION_DURATION: number = 150; // ms
  readonly DEBOUNCE_DELAY: number = 300; // ms

  readonly dateFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

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

  override disconnect(): void {
    this.clearTimers();
    if (this.dialogTarget.open) {
      this.dialogTarget.close();
    }
    document.body.style.overflow = "";
  }

  // UI Control Methods
  open(trigger?: HTMLElement): void {
    if (this.closeTimeout !== null) {
      // Re-opened while the exit animation was running: just animate back in.
      window.clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    if (!this.dialogTarget.open) {
      const active = document.activeElement;
      this.returnFocusTo = trigger ?? (active instanceof HTMLElement && active !== document.body ? active : null);

      document.body.style.overflow = "hidden";
      this.dialogTarget.showModal();
    }

    this.searchTarget.focus();

    // Force a style flush so the enter transition starts from the hidden state.
    void this.panelTarget.offsetWidth;
    this.backdropTarget.classList.remove(...HIDDEN_STATE_CLASSES.backdrop);
    this.panelTarget.classList.remove(...HIDDEN_STATE_CLASSES.panel);
  }

  close(): void {
    if (!this.dialogTarget.open || this.closeTimeout !== null) return;

    this.backdropTarget.classList.add(...HIDDEN_STATE_CLASSES.backdrop);
    this.panelTarget.classList.add(...HIDDEN_STATE_CLASSES.panel);

    this.closeTimeout = window.setTimeout(() => {
      this.closeTimeout = null;
      this.dialogTarget.close();
    }, this.ANIMATION_DURATION);
  }

  isOpen(): boolean {
    return this.dialogTarget.open && this.closeTimeout === null;
  }

  // Formatting Methods
  formatDate(date: string | undefined): string {
    if (!date) return "";

    return this.dateFormatter.format(new Date(date));
  }

  getStatusBadge(status: StatusType | undefined, isSelected: boolean = false): string {
    if (!status || !(status in this.STATUS_ICONS)) return "";

    const statusKey = status as StatusType;
    const icon = this.STATUS_ICONS[statusKey];
    const colorClass = isSelected ? this.STATUS_COLORS[statusKey].selected : this.STATUS_COLORS[statusKey].default;

    return `<span class="text-xs px-2 py-0.5 rounded-full ${colorClass}">${icon} ${status}</span>`;
  }

  // Search Methods
  async fetchSearchResults(query: string): Promise<FetchOutcome> {
    try {
      const result = await actions.search({ name: query });

      if (result.error) {
        console.error("Error fetching search results:", result.error);
        return { ok: false };
      }

      return { ok: true, items: result.data.items };
    } catch (error) {
      console.error("Error fetching search results:", error);
      return { ok: false };
    }
  }

  setStatus(message: string, { visuallyHidden = false }: { visuallyHidden?: boolean } = {}): void {
    this.statusTarget.textContent = message;
    this.statusTarget.classList.toggle("sr-only", visuallyHidden);
  }

  clearResults(): void {
    this.selectedIndex = -1;
    this.filteredItems = [];
    this.resultsTarget.innerHTML = "";
    this.resultsTarget.classList.add("hidden");
    this.searchTarget.setAttribute("aria-expanded", "false");
    this.searchTarget.removeAttribute("aria-activedescendant");
  }

  updateResults(query: string): void {
    if (this.searchTimeout !== null) {
      window.clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    // Invalidate any in-flight request so stale responses are ignored.
    const requestId = ++this.requestId;
    this.clearResults();

    if (query === "") {
      this.setStatus("");
      return;
    }

    if (query.length < 3) {
      this.setStatus("Type at least 3 characters to search…");
      return;
    }

    this.setStatus("Loading…");

    this.searchTimeout = window.setTimeout(async () => {
      this.searchTimeout = null;
      const outcome = await this.fetchSearchResults(query);
      if (requestId !== this.requestId) return;

      if (!outcome.ok) {
        this.setStatus("Search failed. Try again.");
        return;
      }

      this.filteredItems = outcome.items;

      if (this.filteredItems.length === 0) {
        this.setStatus("No results found.");
        return;
      }

      const count = this.filteredItems.length;
      this.setStatus(`${count} ${count === 1 ? "result" : "results"} available.`, { visuallyHidden: true });
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
    }, new Map<string, SearchResultResponse[]>());

    this.resultsTarget.innerHTML = "";
    let currentIndex = 0;
    let groupIndex = 0;

    groupedByType.forEach((items, type) => {
      const groupFragment = this.groupTemplateTarget.content.cloneNode(true) as DocumentFragment;
      const groupElement = groupFragment.firstElementChild as HTMLElement | null;
      if (!groupElement) return;

      const headerId = `command-palette-group-${groupIndex++}`;
      const header = groupElement.firstElementChild as HTMLElement | null;
      if (header) {
        header.id = headerId;
        header.textContent = type;
      }
      groupElement.setAttribute("aria-labelledby", headerId);

      for (const item of items) {
        const isSelected = currentIndex === this.selectedIndex;
        const itemFragment = this.itemTemplateTarget.content.cloneNode(true) as DocumentFragment;
        const itemLink = itemFragment.querySelector<HTMLAnchorElement>("a");
        if (!itemLink) continue;

        itemLink.href = item.url;
        itemLink.id = `${OPTION_ID_PREFIX}${currentIndex}`;
        itemLink.dataset.index = currentIndex.toString();
        itemLink.dataset.id = item.id;
        itemLink.setAttribute("aria-selected", String(isSelected));

        const nameSpan = itemLink.querySelector<HTMLElement>(".item-name");
        if (nameSpan) {
          nameSpan.textContent = item.name;
        }

        const statusBadge = itemLink.querySelector<HTMLElement>(".status-badge");
        if (item.status && statusBadge) {
          statusBadge.innerHTML = this.getStatusBadge(item.status, isSelected);
        } else if (statusBadge) {
          statusBadge.remove();
        }

        const dateText = itemLink.querySelector<HTMLElement>(".date-text");
        if (item.date && dateText) {
          dateText.textContent = this.formatDate(item.date);
        } else if (dateText) {
          dateText.remove();
        }

        groupElement.appendChild(itemFragment);
        currentIndex++;
      }

      this.resultsTarget.appendChild(groupFragment);
    });

    this.resultsTarget.classList.remove("hidden");
    this.searchTarget.setAttribute("aria-expanded", "true");
    this.highlightSelected();
  }

  // Navigation Methods
  highlightSelected(): void {
    this.resultsTarget.querySelectorAll<HTMLElement>("[data-index]").forEach((item) => {
      const itemIndex = parseInt(item.dataset.index || "0", 10);
      const isSelected = itemIndex === this.selectedIndex;
      const currentItem = this.filteredItems[itemIndex];

      item.setAttribute("aria-selected", String(isSelected));

      const statusBadge = item.querySelector<HTMLElement>(".status-badge > span");
      if (statusBadge && currentItem?.status) {
        const status = currentItem.status as StatusType;
        const colorClass = isSelected ? this.STATUS_COLORS[status].selected : this.STATUS_COLORS[status].default;

        statusBadge.className = `text-xs px-2 py-0.5 rounded-full ${colorClass}`;
      }

      if (isSelected) {
        item.scrollIntoView({ block: "nearest" });
      }
    });

    if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredItems.length) {
      this.searchTarget.setAttribute("aria-activedescendant", `${OPTION_ID_PREFIX}${this.selectedIndex}`);
    } else {
      this.searchTarget.removeAttribute("aria-activedescendant");
    }
  }

  selectItem(item: SearchResultResponse): void {
    window.location.href = item.url;
    this.close();
  }

  // Event Handlers
  handleDocumentClick(e: MouseEvent): void {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const toggle = target.closest<HTMLElement>("[data-js-command-palette-toggle]");
    if (!toggle) return;

    e.preventDefault();
    this.open(toggle);
  }

  handleDialogClick(e: MouseEvent): void {
    // Clicks outside the panel land on the dialog itself or the backdrop.
    if (e.target instanceof Node && !this.panelTarget.contains(e.target)) {
      this.close();
    }
  }

  handleCancel(e: Event): void {
    // Run the exit animation instead of closing instantly on Escape.
    e.preventDefault();
    this.close();
  }

  handleClose(): void {
    this.clearTimers();
    this.closeTimeout = null;
    this.requestId++;

    document.body.style.overflow = "";
    this.backdropTarget.classList.add(...HIDDEN_STATE_CLASSES.backdrop);
    this.panelTarget.classList.add(...HIDDEN_STATE_CLASSES.panel);

    this.searchTarget.value = "";
    this.clearResults();
    this.setStatus("");

    if (this.returnFocusTo?.isConnected) {
      this.returnFocusTo.focus();
    }
    this.returnFocusTo = null;
  }

  handleResultClick(e: MouseEvent): void {
    if (e.target instanceof Element && e.target.closest("[data-index]")) {
      // The browser handles navigation via the href attribute.
      this.close();
    }
  }

  handleResultHover(e: MouseEvent): void {
    const option = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-index]") : null;
    if (!option) return;

    const index = parseInt(option.dataset.index || "0", 10);
    if (index === this.selectedIndex) return;

    this.selectedIndex = index;
    this.highlightSelected();
  }

  handleSearchInput(): void {
    this.updateResults(this.searchTarget.value);
  }

  handleSearchKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (this.filteredItems.length === 0) return;
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.highlightSelected();
        break;

      case "ArrowUp":
        e.preventDefault();
        if (this.filteredItems.length === 0) return;
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.highlightSelected();
        break;

      case "Enter": {
        e.preventDefault();
        const item = this.filteredItems[this.selectedIndex];
        if (item) {
          this.selectItem(item);
        }
        break;
      }
    }
  }

  handleGlobalKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();

      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  private clearTimers(): void {
    if (this.searchTimeout !== null) {
      window.clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    if (this.closeTimeout !== null) {
      window.clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
}
