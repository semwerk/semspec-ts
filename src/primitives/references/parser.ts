/**
 * Reference parser for Semcontext Reference Protocol v1.0
 */

import type { SegmentRef, ProjectRef, PageRef, ReferenceContext, ResolvedRef } from './types.js';

/**
 * Parse a segment reference.
 *
 * Supports formats:
 * - @project/page#segment (full)
 * - page#segment (project-relative)
 * - #segment (fragment-only)
 *
 * @param ref - Reference string
 * @returns Parsed components or null if invalid
 */
export function parseSegmentRef(ref: string): SegmentRef | null {
  const original = ref;

  // Fragment-only (#segment)
  if (ref.startsWith('#')) {
    return {
      project: null,
      documentId: null,
      segmentId: ref.substring(1),
      original,
    };
  }

  // Find # separator
  const hashIdx = ref.lastIndexOf('#');
  if (hashIdx === -1 || hashIdx === ref.length - 1) {
    return null; // Invalid: no fragment or empty
  }

  const segmentId = ref.substring(hashIdx + 1);
  const resourcePath = ref.substring(0, hashIdx);

  // Full format (@project/page#segment)
  if (resourcePath.startsWith('@')) {
    const slashIdx = resourcePath.indexOf('/');
    if (slashIdx === -1) {
      return null; // Invalid: @ but no /
    }

    return {
      project: resourcePath.substring(1, slashIdx),
      documentId: resourcePath.substring(slashIdx + 1),
      segmentId,
      original,
    };
  }

  // Relative format (page#segment)
  return {
    project: null,
    documentId: resourcePath,
    segmentId,
    original,
  };
}

/**
 * Build a segment reference string.
 *
 * @param project - Project identifier
 * @param pageId - Page/document identifier
 * @param segmentId - Segment identifier
 * @returns Formatted reference: @project/page#segment
 */
export function buildSegmentRef(
  project: string,
  pageId: string,
  segmentId: string
): string {
  return `@${project}/${pageId}#${segmentId}`;
}

/**
 * Parse a project reference.
 *
 * Supports:
 * - @project
 * - repository:project
 * - tenant:org/project
 *
 * @param ref - Reference string
 * @returns Parsed components or null
 */
export function parseProjectRef(ref: string): ProjectRef | null {
  const original = ref;

  // @project format
  if (ref.startsWith('@')) {
    const project = ref.substring(1);
    if (!project) return null;

    return {
      scope: '@',
      project,
      original,
    };
  }

  // repository:project or tenant:org/project
  const colonIdx = ref.indexOf(':');
  if (colonIdx === -1) return null;

  const scope = ref.substring(0, colonIdx + 1); // Include colon
  const project = ref.substring(colonIdx + 1);

  if (!project) return null;

  return {
    scope,
    project,
    original,
  };
}

/**
 * Parse a page reference.
 *
 * Supports:
 * - @project/page
 * - page (relative)
 *
 * @param ref - Reference string
 * @returns Parsed components or null
 */
export function parsePageRef(ref: string): PageRef | null {
  const original = ref;

  // Full format (@project/page)
  if (ref.startsWith('@')) {
    const slashIdx = ref.indexOf('/');
    if (slashIdx === -1) {
      // Just @project with no page
      return null;
    }

    return {
      project: ref.substring(1, slashIdx),
      pageId: ref.substring(slashIdx + 1),
      original,
    };
  }

  // Relative format (page)
  return {
    project: null,
    pageId: ref,
    original,
  };
}

/**
 * Resolve a reference with context.
 *
 * Fills in missing components from context.
 *
 * @param ref - Reference string
 * @param context - Resolution context
 * @returns Resolved reference
 * @throws Error if reference cannot be resolved
 */
export function resolveReference(
  ref: string,
  context: ReferenceContext
): ResolvedRef {
  const parsed = parseSegmentRef(ref);
  if (!parsed) {
    throw new Error(`Invalid reference format: ${ref}`);
  }

  // Resolve project
  const project = parsed.project || context.currentProject;
  if (!project) {
    throw new Error(`Cannot resolve project from reference: ${ref}`);
  }

  // Resolve page
  const page = parsed.documentId || context.currentPage;
  if (!page) {
    throw new Error(`Cannot resolve page from reference: ${ref}`);
  }

  // Build canonical reference
  const canonical = buildSegmentRef(project, page, parsed.segmentId);

  return {
    canonical,
    scope: '@',
    project,
    page,
    segment: parsed.segmentId,
  };
}

/**
 * Check if a reference is valid.
 */
export function isValidSegmentRef(ref: string): boolean {
  return parseSegmentRef(ref) !== null;
}

/**
 * Check if a reference is absolute (has project).
 */
export function isAbsoluteRef(ref: string): boolean {
  return ref.startsWith('@') || ref.includes(':');
}

/**
 * Check if a reference is relative.
 */
export function isRelativeRef(ref: string): boolean {
  return !isAbsoluteRef(ref) && !ref.startsWith('#');
}

/**
 * Check if a reference is a fragment-only.
 */
export function isFragmentRef(ref: string): boolean {
  return ref.startsWith('#');
}
