/**
 * Segment types and interfaces matching Semcontext Segments v1.0 specification.
 * This is the core, framework-agnostic implementation.
 */

/**
 * Return configuration for static/retrieval segments.
 */
export interface ReturnConfig {
  /** Token budget for prompt injection during retrieval */
  maxTokens: number;
}

/**
 * Generate configuration for AI-generated segments.
 */
export interface GenerateConfig {
  /** Token budget for content generation */
  maxTokens: number;
  /** LLM temperature (0.0-2.0) */
  temperature?: number;
  /** Number of generation passes */
  iterations?: number;
}

/**
 * Segment specification from frontmatter.
 */
export interface SegmentSpec {
  /** Unique identifier for this segment within the document */
  id: string;
  /** Content type (overview, howto, reference, api, troubleshooting, faq, example, conceptual) */
  type?: string;
  /** Target audience(s) */
  audienceRole?: string[];
  /** Semantic tags for retrieval */
  concepts?: string[];
  /** Retrieval ranking multiplier (default: 1.0) */
  boost?: number;
  /** Retrieval configuration (mutually exclusive with generate) */
  return?: ReturnConfig;
  /** Generation configuration (mutually exclusive with return) */
  generate?: GenerateConfig;
}

/**
 * Semcontext configuration section from frontmatter.
 */
export interface SemcontextConfig {
  segments?: SegmentSpec[];
}

/**
 * Frontmatter configuration.
 */
export interface FrontmatterConfig {
  /** Standard frontmatter fields */
  id?: string;
  title?: string;
  description?: string;
  /** Semcontext-specific configuration */
  semcontext?: SemcontextConfig;
}

/**
 * Marker range representing byte positions of a segment.
 */
export interface MarkerRange {
  /** Segment ID from the marker */
  id: string;
  /** Byte offset where start marker begins */
  startMarkerBegin: number;
  /** Byte offset where start marker ends */
  startMarkerEnd: number;
  /** Byte offset where end marker begins */
  endMarkerBegin: number;
  /** Byte offset where end marker ends */
  endMarkerEnd: number;
}

/**
 * Segment instance with content and metadata.
 */
export interface SegmentInstance {
  /** Segment identifier */
  id: string;
  /** Segment specification from frontmatter (null if not defined) */
  spec: SegmentSpec | null;
  /** Segment body (markdown content) */
  body: string;
  /** Byte offset where segment body begins */
  startByte: number;
  /** Byte offset where segment body ends */
  endByte: number;
}

/**
 * Parsed document with frontmatter and segments.
 */
export interface ParsedDoc {
  /** Parsed frontmatter configuration */
  frontmatter: FrontmatterConfig;
  /** Segment instances found in the document */
  segments: SegmentInstance[];
  /** Byte offset where frontmatter ends */
  frontmatterEndByte: number;
  /** Content without frontmatter */
  contentWithoutFrontmatter: string;
}

/**
 * Indexed segment ready for storage/retrieval.
 */
export interface IndexedSegment {
  /** Segment identifier */
  segmentId: string;
  /** Full reference: <doc_id>#<segment_id> */
  segmentRef: string;
  /** Content type */
  type?: string;
  /** Target audience(s) */
  audienceRole?: string[];
  /** Semantic tags */
  concepts?: string[];
  /** Retrieval multiplier */
  boost?: number;
  /** Token budget */
  maxTokens?: number;
  /** Segment content */
  bodyMarkdown: string;
  /** Byte offset where body begins */
  startByte: number;
  /** Byte offset where body ends */
  endByte: number;
}

/**
 * Segment index for a document.
 */
export interface SegmentIndex {
  /** Source document identifier */
  documentId?: string;
  /** Indexed segments */
  segments: IndexedSegment[];
}

/**
 * Validation error.
 */
export interface ValidationError {
  /** Segment ID (empty for global errors) */
  segmentId?: string;
  /** Field that failed validation */
  field?: string;
  /** Error message */
  message: string;
}
