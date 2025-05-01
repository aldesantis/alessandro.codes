import navigation from "src/data/navigation.json";

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

export function isDropdownActive(item: NavigationItem, currentPath: string): boolean {
  if (item.href === currentPath) return true;

  // Check if any child matches
  if (!item.children) return false;
  return item.children.some((child) => {
    if (!child.matchPattern) return false;
    return new RegExp(child.matchPattern).test(currentPath);
  });
}

export function isItemActive(item: NavigationChild, currentPath: string): boolean {
  if (!item.matchPattern) return false;
  return new RegExp(item.matchPattern).test(currentPath);
}

export function getHeaderNavigation(): NavigationItem[] {
  return navigation.filter((item: NavigationItem) => item.header);
}

export function getFooterNavigation(): NavigationChild[] {
  return navigation
    .filter((item: NavigationItem) => item.footer || (item.children && item.children.some((child) => child.footer)))
    .flatMap((item: NavigationItem) => {
      if (item.children && item.children.length > 0) {
        return item.children.filter((child) => child.footer);
      }
      return item.footer ? [item] : [];
    });
}
