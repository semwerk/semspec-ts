/**
 * StrongLinks types for Semcontext StrongLink Protocol v1.0
 */

/**
 * Link target with resolution information
 */
export interface LinkTarget {
  /** Stable link ID */
  id: string;
  /** Target segment reference (@project/page#segment) */
  segmentRef?: string;
  /** Target page reference (@project/page) */
  pageRef?: string;
  /** Resolved URL */
  url: string;
  /** Link title/label */
  title?: string;
  /** Link description */
  description?: string;
  /** Version-specific */
  version?: string;
}

/**
 * Link registry for resolution
 */
export interface LinkRegistry {
  /** Map of link ID to target */
  links: Map<string, LinkTarget>;

  /** Register a link */
  register(id: string, target: LinkTarget): void;

  /** Resolve a link ID to target */
  resolve(id: string): LinkTarget | null;

  /** Check if link exists */
  has(id: string): boolean;

  /** Get all links */
  all(): LinkTarget[];
}
