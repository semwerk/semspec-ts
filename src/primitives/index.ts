/**
 * @sem/primitives
 *
 * TypeScript implementation of Semcontext specifications.
 * Framework-agnostic primitives for building intelligent documentation systems.
 *
 * @example
 * ```typescript
 * import { Segments, References, StrongLinks } from '@sem/primitives';
 *
 * // Parse segments
 * const parsed = Segments.parseSegments(markdown);
 * const errors = Segments.validateSegments(parsed);
 *
 * // Parse references
 * const ref = References.parseSegmentRef('@docs/api#auth');
 *
 * // Resolve strong links
 * const target = StrongLinks.resolve('installation');
 * ```
 *
 * @packageDocumentation
 */

/**
 * Version of this implementation
 */
export const VERSION = '1.0.0';

/**
 * Semcontext specification version implemented
 */
export const SPEC_VERSION = '1.0.0';

// Core primitives
export * as Segments from './segments/index.js';
export * as References from './references/index.js';
export * as StrongLinks from './stronglinks/index.js';
export * as Navigation from './navigation/index.js';
export * as Versioning from './versioning/index.js';
export * as Metadata from './metadata/index.js';

// Commonly used types
export type {
  SegmentSpec,
  ParsedDoc,
  SegmentIndex,
  IndexedSegment,
  SegmentInstance,
  ReturnConfig,
  GenerateConfig,
} from './segments/types.js';

export type {
  SegmentRef,
  ProjectRef,
  PageRef,
} from './references/types.js';
