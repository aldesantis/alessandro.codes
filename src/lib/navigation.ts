import navigation from "src/data/navigation.json";

// Define types for navigation items
export type NavigationChild = {
  href: string;
  text: string;
  matchPattern?: string;
  header: boolean;
  footer: boolean;
};

export type NavigationItem = NavigationChild & {
  children?: NavigationChild[];
};

/**
 * Checks if a dropdown should be active based on the current path
 */
export function isDropdownActive(
  item: NavigationItem,
  currentPath: string
): boolean {
  if (!item.children) return false;
  return item.children.some((child) => {
    if (!child.matchPattern) return false;
    return new RegExp(child.matchPattern).test(currentPath);
  });
}

/**
 * Checks if a navigation item is active based on the current path
 */
export function isItemActive(
  item: NavigationChild,
  currentPath: string
): boolean {
  if (!item.matchPattern) return false;
  return new RegExp(item.matchPattern).test(currentPath);
}

/**
 * Gets navigation items for the header
 */
export function getHeaderNavigation(): NavigationItem[] {
  return navigation.filter((item: NavigationItem) => item.header);
}

/**
 * Gets flattened navigation items for the footer
 */
export function getFooterNavigation(): NavigationChild[] {
  return navigation
    .filter(
      (item: NavigationItem) =>
        item.footer ||
        (item.children && item.children.some((child) => child.footer))
    )
    .flatMap((item: NavigationItem) => {
      if (item.children && item.children.length > 0) {
        return item.children.filter((child) => child.footer);
      }
      return item.footer ? [item] : [];
    });
}
