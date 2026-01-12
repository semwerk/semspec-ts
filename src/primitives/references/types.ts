/**
 * Reference types for Semcontext Reference Protocol v1.0
 */

/**
 * Parsed segment reference components
 */
export interface SegmentRef {
  /** Project identifier (null if relative reference) */
  project: string | null;
  /** Document/page identifier (null if fragment-only) */
  documentId: string | null;
  /** Segment identifier */
  segmentId: string;
  /** Original reference string */
  original: string;
}

/**
 * Parsed project reference
 */
export interface ProjectRef {
  /** Scope prefix (@, repository:, tenant:) */
  scope: string;
  /** Project identifier */
  project: string;
  /** Original reference string */
  original: string;
}

/**
 * Parsed page reference
 */
export interface PageRef {
  /** Project identifier (null if relative) */
  project: string | null;
  /** Page/document identifier */
  pageId: string;
  /** Original reference string */
  original: string;
}

/**
 * Reference resolution context
 */
export interface ReferenceContext {
  /** Current project */
  currentProject?: string;
  /** Current page */
  currentPage?: string;
  /** Current segment */
  currentSegment?: string;
}

/**
 * Resolved reference with all components filled in
 */
export interface ResolvedRef {
  /** Canonical reference string */
  canonical: string;
  /** Scope prefix */
  scope: string;
  /** Project identifier */
  project: string;
  /** Page identifier */
  page: string;
  /** Segment identifier (if present) */
  segment?: string;
}
