/**
 * Segments module - Semcontext Segments v1.0 implementation for TypeScript.
 *
 * Framework-agnostic segment parsing, validation, and indexing.
 * Can be used in Node.js, browsers, CLI tools, etc.
 *
 * @module segments
 */

// Parser
export { parseSegments, extractFrontmatter, parseSegmentRef, buildSegmentRef } from './parser.js';

// Validator
export { validateSegments, validateStrict, validateLoose } from './validator.js';

// Utilities
export {
  buildSegmentIndex,
  getSegmentById,
  getSegmentsByType,
  getSegmentsForGeneration,
  getSegmentsForRetrieval,
  getTotalTokenBudget,
} from './utils.js';

// Types
export type {
  ReturnConfig,
  GenerateConfig,
  SegmentSpec,
  SemcontextConfig,
  FrontmatterConfig,
  MarkerRange,
  SegmentInstance,
  ParsedDoc,
  IndexedSegment,
  SegmentIndex,
  ValidationError,
} from './types.js';
