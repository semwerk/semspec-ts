import type { ParsedDoc, SegmentIndex, IndexedSegment, SegmentInstance } from './types.js';
import { buildSegmentRef } from './parser.js';

/**
 * Build a segment index for storage/retrieval.
 *
 * @param parsed - Parsed document
 * @param project - Project identifier
 * @param documentId - Document identifier
 * @returns Segment index with full metadata
 */
export function buildSegmentIndex(
  parsed: ParsedDoc,
  project: string,
  documentId: string
): SegmentIndex {
  const index: SegmentIndex = {
    documentId,
    segments: [],
  };

  for (const seg of parsed.segments) {
    const indexed: IndexedSegment = {
      segmentId: seg.id,
      segmentRef: buildSegmentRef(project, documentId, seg.id),
      bodyMarkdown: seg.body,
      startByte: seg.startByte,
      endByte: seg.endByte,
    };

    // Copy spec metadata if available
    if (seg.spec) {
      indexed.type = seg.spec.type;
      indexed.audienceRole = seg.spec.audienceRole;
      indexed.concepts = seg.spec.concepts;
      indexed.boost = seg.spec.boost;

      // Get max_tokens from return or generate
      if (seg.spec.return) {
        indexed.maxTokens = seg.spec.return.maxTokens;
      } else if (seg.spec.generate) {
        indexed.maxTokens = seg.spec.generate.maxTokens;
      }
    }

    index.segments.push(indexed);
  }

  return index;
}

/**
 * Find a segment by ID in a parsed document.
 */
export function getSegmentById(
  parsed: ParsedDoc,
  segmentId: string
): SegmentInstance | null {
  return parsed.segments.find((seg) => seg.id === segmentId) || null;
}

/**
 * Get all segments of a specific type.
 */
export function getSegmentsByType(parsed: ParsedDoc, type: string): SegmentInstance[] {
  return parsed.segments.filter((seg) => seg.spec?.type === type);
}

/**
 * Get segments that have generate configuration.
 */
export function getSegmentsForGeneration(parsed: ParsedDoc): SegmentInstance[] {
  return parsed.segments.filter((seg) => seg.spec?.generate !== undefined);
}

/**
 * Get segments that have return configuration.
 */
export function getSegmentsForRetrieval(parsed: ParsedDoc): SegmentInstance[] {
  return parsed.segments.filter((seg) => seg.spec?.return !== undefined);
}

/**
 * Get total token budget across all segments.
 */
export function getTotalTokenBudget(parsed: ParsedDoc): number {
  let total = 0;

  for (const seg of parsed.segments as SegmentInstance[]) {
    if (!seg.spec) continue;

    if (seg.spec.return) {
      total += seg.spec.return.maxTokens;
    } else if (seg.spec.generate) {
      total += seg.spec.generate.maxTokens;
    }
  }

  return total;
}
