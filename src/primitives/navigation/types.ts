/**
 * Navigation types for Semcontext Navigation Protocol v1.0
 */

/**
 * Navigation item
 */
export interface NavigationItem {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Link target (segment ref, page ref, or URL) */
  link?: string;
  /** Child items */
  children?: NavigationItem[];
  /** Don't render as clickable link */
  noLink?: boolean;
  /** Icon (emoji or name) */
  icon?: string;
  /** Badge text */
  badge?: string;
  /** Order/sort priority */
  order?: number;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Navigation tree
 */
export interface NavigationTree {
  /** Tree identifier */
  id: string;
  /** Tree label/title */
  label?: string;
  /** Root items */
  items: NavigationItem[];
  /** Versions this tree applies to */
  versions?: string[];
  /** Default tree */
  default?: boolean;
}

/**
 * Flattened navigation item (for rendering)
 */
export interface FlatNavigationItem extends NavigationItem {
  /** Depth level (0 = root) */
  level: number;
  /** Path from root (IDs) */
  path: string[];
  /** Parent ID */
  parentId?: string;
  /** Has children */
  hasChildren: boolean;
}
