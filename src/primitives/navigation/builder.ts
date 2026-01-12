/**
 * Navigation tree builder
 */

import type { NavigationTree, NavigationItem, FlatNavigationItem } from './types.js';

/**
 * Build a navigation tree from configuration
 */
export function buildTree(config: NavigationTree): NavigationTree {
  return {
    ...config,
    items: config.items.map(normalizeItem),
  };
}

/**
 * Normalize a navigation item (add defaults)
 */
function normalizeItem(item: NavigationItem): NavigationItem {
  return {
    ...item,
    noLink: item.noLink ?? false,
    children: item.children?.map(normalizeItem),
  };
}

/**
 * Flatten navigation tree for rendering
 */
export function flattenTree(tree: NavigationTree): FlatNavigationItem[] {
  const flat: FlatNavigationItem[] = [];

  function traverse(
    items: NavigationItem[],
    level: number = 0,
    path: string[] = [],
    parentId?: string
  ) {
    items.forEach((item) => {
      const itemPath = [...path, item.id];

      flat.push({
        ...item,
        level,
        path: itemPath,
        parentId,
        hasChildren: (item.children?.length || 0) > 0,
      });

      if (item.children) {
        traverse(item.children, level + 1, itemPath, item.id);
      }
    });
  }

  traverse(tree.items);
  return flat;
}

/**
 * Find an item by ID in the tree
 */
export function findItem(
  tree: NavigationTree,
  id: string
): NavigationItem | null {
  function search(items: NavigationItem[]): NavigationItem | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = search(item.children);
        if (found) return found;
      }
    }
    return null;
  }

  return search(tree.items);
}

/**
 * Get breadcrumbs for an item
 */
export function getBreadcrumbs(
  tree: NavigationTree,
  itemId: string
): NavigationItem[] {
  const flat = flattenTree(tree);
  const item = flat.find((i) => i.id === itemId);

  if (!item) return [];

  return item.path
    .map((id) => flat.find((i) => i.id === id))
    .filter((i): i is FlatNavigationItem => i !== undefined);
}

/**
 * Filter tree by version
 */
export function filterByVersion(
  tree: NavigationTree,
  version: string
): NavigationTree {
  // If tree specifies versions and current version not in list, return empty
  if (tree.versions && !tree.versions.includes(version)) {
    return { ...tree, items: [] };
  }

  // Filter items recursively
  const filterItems = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .filter((item) => {
        // Include if no version constraint or version matches
        const itemVersions = (item.metadata?.versions as string[]) || tree.versions;
        return !itemVersions || itemVersions.includes(version);
      })
      .map((item) => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
      }));
  };

  return {
    ...tree,
    items: filterItems(tree.items),
  };
}
