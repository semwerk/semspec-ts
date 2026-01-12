/**
 * Navigation module - Semcontext Navigation Protocol v1.0
 *
 * Hierarchical navigation trees for documentation.
 *
 * @module navigation
 */

export {
  buildTree,
  flattenTree,
  findItem,
  getBreadcrumbs,
  filterByVersion,
} from './builder.js';

export type {
  NavigationItem,
  NavigationTree,
  FlatNavigationItem,
} from './types.js';
