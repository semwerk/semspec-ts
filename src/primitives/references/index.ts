/**
 * References module - Semcontext Reference Protocol v1.0
 *
 * Universal addressing for documentation content.
 *
 * @module references
 */

export {
  parseSegmentRef,
  buildSegmentRef,
  parseProjectRef,
  parsePageRef,
  resolveReference,
  isValidSegmentRef,
  isAbsoluteRef,
  isRelativeRef,
  isFragmentRef,
} from './parser.js';

export type {
  SegmentRef,
  ProjectRef,
  PageRef,
  ReferenceContext,
  ResolvedRef,
} from './types.js';
