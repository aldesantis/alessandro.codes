import navigation from "src/data/navigation.json";

export type NavigationLeaf = {
  href: string;
  text: string;
  matchPattern: string;
  header: boolean;
  footer: boolean;
  /** Which footer column the link belongs to (required when `footer` is true). */
  footerGroup?: string;
};

export type NavigationItem = NavigationLeaf & {
  children?: NavigationLeaf[];
};

function normalizePath(path: string): string {
  let normalized = path === "/" ? "/" : path.replace(/\/$/, "");
  normalized = normalized.replace(/\/index\.html$/, "");

  return normalized || "/";
}

export function isItemActive(item: NavigationItem, currentPath: string): boolean {
  const normalizedPath = normalizePath(currentPath);
  const matchPattern = new RegExp(item.matchPattern);

  if (matchPattern.test(normalizedPath)) {
    return true;
  }

  if (item.children && item.children.length > 0) {
    return item.children.some((child) => {
      return isItemActive(child, normalizedPath);
    });
  }

  return false;
}

export function getHeaderNavigation(): NavigationItem[] {
  return navigation.filter((item: NavigationItem) => item.header);
}

export type FooterNavigationGroup = {
  label: string;
  items: NavigationLeaf[];
};

const FOOTER_GROUPS: { id: string; label: string }[] = [
  { id: "site", label: "Site" },
  { id: "garden", label: "Garden" },
];

export function getFooterNavigationGroups(): FooterNavigationGroup[] {
  const items = getFooterNavigation();

  return FOOTER_GROUPS.map(({ id, label }) => ({
    label,
    items: items.filter((item) => item.footerGroup === id),
  })).filter((group) => group.items.length > 0);
}

export function getFooterNavigation(): NavigationLeaf[] {
  return navigation
    .filter((item: NavigationItem) => item.footer || (item.children && item.children.some((child) => child.footer)))
    .flatMap((item: NavigationItem) => {
      if (item.children && item.children.length > 0) {
        return item.children.filter((child) => child.footer);
      }
      return item.footer ? [item] : [];
    });
}
