/**
 * Segment parser - TypeScript port of semcontext/core/pkg/segments
 * Parses Semcontext Segments v1.0 format
 */

import yaml from 'yaml';
import type {
  ParsedDoc,
  FrontmatterConfig,
  SegmentInstance,
  MarkerRange,
  ValidationError,
} from './types.js';

// Regex patterns
const SEGMENT_START_RE = /<!--\s*semcontext:segment\s+start\s+key="([^"]+)"\s*-->/g;
const SEGMENT_END_RE = /<!--\s*semcontext:segment\s+end\s*-->/g;
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parse segments from a markdown document.
 *
 * @param docText - Markdown document content
 * @returns Parsed document with frontmatter and segments
 *
 * @example
 * ```typescript
 * const parsed = parseSegments(markdown);
 * console.log(`Found ${parsed.segments.length} segments`);
 * ```
 */
export function parseSegments(docText: string): ParsedDoc {
  const doc: ParsedDoc = {
    frontmatter: {},
    segments: [],
    frontmatterEndByte: 0,
    contentWithoutFrontmatter: docText,
  };

  // 1. Extract frontmatter
  const frontmatterMatch = FRONTMATTER_RE.exec(docText);
  if (frontmatterMatch) {
    const frontmatterYAML = frontmatterMatch[1];
    doc.frontmatterEndByte = frontmatterMatch[0].length;
    doc.contentWithoutFrontmatter = docText.substring(frontmatterMatch[0].length);

    try {
      doc.frontmatter = yaml.parse(frontmatterYAML) || {};

      // Normalize audience_role (can be string or string[])
      if (doc.frontmatter.semcontext?.segments) {
        for (const seg of doc.frontmatter.semcontext.segments) {
          seg.audienceRole = normalizeAudienceRole(seg.audienceRole);
          if (!seg.boost) {
            seg.boost = 1.0; // Default boost
          }
        }
      }
    } catch (err) {
      throw new Error(`Failed to parse YAML frontmatter: ${err}`);
    }
  }

  // Build segment spec map by ID
  const specMap = new Map<string, any>();
  if (doc.frontmatter.semcontext?.segments) {
    for (const spec of doc.frontmatter.semcontext.segments) {
      specMap.set(spec.id, spec);
    }
  }

  // 2. Find all segment markers
  const markers = parseMarkers(
    doc.contentWithoutFrontmatter,
    doc.frontmatterEndByte
  );

  // 3. Build segment instances
  for (const marker of markers) {
    const body = docText.substring(marker.startMarkerEnd, marker.endMarkerBegin).trim();

    const instance: SegmentInstance = {
      id: marker.id,
      spec: specMap.get(marker.id) || null,
      body,
      startByte: marker.startMarkerEnd,
      endByte: marker.endMarkerBegin,
    };

    doc.segments.push(instance);
  }

  return doc;
}

/**
 * Parse segment markers from content.
 */
function parseMarkers(content: string, offsetAdjust: number): MarkerRange[] {
  const startMatches: RegExpExecArray[] = [];
  const endMatches: RegExpExecArray[] = [];

  // Find all start markers
  SEGMENT_START_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SEGMENT_START_RE.exec(content))) {
    startMatches.push(match);
  }

  // Find all end markers
  SEGMENT_END_RE.lastIndex = 0;
  while ((match = SEGMENT_END_RE.exec(content))) {
    endMatches.push(match);
  }

  // Validate pairing
  if (startMatches.length !== endMatches.length) {
    throw new Error(
      `Mismatched segment markers: found ${startMatches.length} start markers and ${endMatches.length} end markers`
    );
  }

  const markers: MarkerRange[] = [];

  for (let i = 0; i < startMatches.length; i++) {
    const start = startMatches[i];
    const end = endMatches[i];

    // Check proper ordering
    if (end.index < start.index + start[0].length) {
      throw new Error('Segment end marker appears before start marker ends');
    }

    // Check for nesting
    if (i + 1 < startMatches.length && startMatches[i + 1].index < end.index) {
      const id1 = start[1];
      const id2 = startMatches[i + 1][1];
      throw new Error(
        `Nested segments not allowed: segment '${id2}' starts before '${id1}' ends`
      );
    }

    const id = start[1];
    markers.push({
      id,
      startMarkerBegin: start.index + offsetAdjust,
      startMarkerEnd: start.index + start[0].length + offsetAdjust,
      endMarkerBegin: end.index + offsetAdjust,
      endMarkerEnd: end.index + end[0].length + offsetAdjust,
    });
  }

  return markers;
}

/**
 * Normalize audience_role to array form.
 */
function normalizeAudienceRole(raw: any): string[] | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) {
    return raw.filter((item) => typeof item === 'string');
  }
  return undefined;
}

/**
 * Extract just the frontmatter without parsing segments.
 *
 * @param docText - Document content
 * @returns Frontmatter config and byte offset where content begins
 */
export function extractFrontmatter(
  docText: string
): { config: FrontmatterConfig | null; endByte: number } {
  const match = FRONTMATTER_RE.exec(docText);
  if (!match) {
    return { config: null, endByte: 0 };
  }

  const frontmatterYAML = match[1];
  try {
    const config: FrontmatterConfig = yaml.parse(frontmatterYAML) || {};

    // Normalize audience_role
    if (config.semcontext?.segments) {
      for (const seg of config.semcontext.segments) {
        seg.audienceRole = normalizeAudienceRole(seg.audienceRole);
        if (!seg.boost) {
          seg.boost = 1.0;
        }
      }
    }

    return { config, endByte: match[0].length };
  } catch (err) {
    throw new Error(`Failed to parse YAML frontmatter: ${err}`);
  }
}

/**
 * Parse segment reference into components.
 *
 * Supports formats:
 * - @project/document#segment (full)
 * - document#segment (relative, no project)
 * - #segment (fragment only)
 *
 * @param segmentRef - Segment reference
 * @returns Parsed components or null if invalid
 *
 * @example
 * ```typescript
 * parseSegmentRef("@docs/api-guide#authentication")
 * // { project: "docs", documentId: "api-guide", segmentId: "authentication" }
 *
 * parseSegmentRef("api-guide#authentication")
 * // { project: null, documentId: "api-guide", segmentId: "authentication" }
 *
 * parseSegmentRef("#authentication")
 * // { project: null, documentId: null, segmentId: "authentication" }
 * ```
 */
export function parseSegmentRef(segmentRef: string): {
  project: string | null;
  documentId: string | null;
  segmentId: string;
} | null {
  // Handle fragment-only (#segment)
  if (segmentRef.startsWith('#')) {
    return {
      project: null,
      documentId: null,
      segmentId: segmentRef.substring(1),
    };
  }

  // Find # separator
  const hashIdx = segmentRef.lastIndexOf('#');
  if (hashIdx === -1 || hashIdx === segmentRef.length - 1) {
    return null; // Invalid: no fragment or empty fragment
  }

  const segmentId = segmentRef.substring(hashIdx + 1);
  const resourcePath = segmentRef.substring(0, hashIdx);

  // Check for @project/ prefix
  if (resourcePath.startsWith('@')) {
    // Full format: @project/document#segment
    const slashIdx = resourcePath.indexOf('/');
    if (slashIdx === -1) {
      return null; // Invalid: @ but no /
    }

    return {
      project: resourcePath.substring(1, slashIdx), // Remove @
      documentId: resourcePath.substring(slashIdx + 1),
      segmentId,
    };
  } else {
    // Relative format: document#segment
    return {
      project: null,
      documentId: resourcePath,
      segmentId,
    };
  }
}

/**
 * Build a segment reference in format: @project/document#segment
 *
 * @example
 * ```typescript
 * buildSegmentRef("docs", "api-guide", "authentication")
 * // "@docs/api-guide#authentication"
 * ```
 */
export function buildSegmentRef(
  project: string,
  documentId: string,
  segmentId: string
): string {
  return `@${project}/${documentId}#${segmentId}`;
}
