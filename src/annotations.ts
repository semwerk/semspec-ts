export interface ByteRange {
  start: number;
  end: number;
}

export interface LineRange {
  start: number;
  end: number;
}

export interface ExternalAnnotations {
  version: string;
  source_file: string;
  source_checksum?: string;
  semantics?: ContentSemantics;
  segments: AnnotatedSegment[];
  metadata?: AnnotationMetadata;
}

export interface ContentSemantics {
  tasks?: string[];
  problems?: string[];
  solutions?: string[];
  outcomes?: string[];
  features?: string[];
  personas?: string[];
}

export interface SegmentSemantics {
  tasks?: string[];
  problems?: string[];
  solutions?: string[];
  outcomes?: string[];
  validations?: string[];
  next_steps?: string[];
  impacts?: string[];
  features?: string[];
}

export interface AnnotatedSegment {
  id: string;
  type?: string;
  audience_role?: string | string[];
  concepts?: string | string[];
  boost?: number;
  semantics?: SegmentSemantics;
  byte_range?: ByteRange;
  line_range?: LineRange;
  heading?: string;
  segment_checksum?: string;
  segment_ref?: string;
  can_edit?: boolean;
  return?: TokenConfig;
  generate?: GenerateConfig;
}

export interface TokenConfig {
  max_tokens?: number;
  min_tokens?: number;
}

export interface GenerateConfig extends TokenConfig {
  model?: string;
  temperature?: number;
  context?: string;
}

export interface AnnotationMetadata {
  annotated_by?: string;
  description?: string;
  date_created?: string;
  date_updated?: string;
  [key: string]: any;
}

export function parseExternalAnnotations(jsonContent: string): ExternalAnnotations {
  const anno = JSON.parse(jsonContent) as ExternalAnnotations;
  return anno;
}

export function validateExternalAnnotations(anno: ExternalAnnotations): string[] {
  const errors: string[] = [];

  if (!anno.version) errors.push('Version is required');
  if (anno.version !== '1') errors.push('Unsupported version');
  if (!anno.source_file) errors.push('Source file is required');
  if (!anno.segments || anno.segments.length === 0) {
    errors.push('At least one segment required');
  }

  const segmentIds = new Set<string>();
  for (const segment of anno.segments || []) {
    if (!segment.id) errors.push('Segment ID is required');
    if (segmentIds.has(segment.id)) {
      errors.push(`Duplicate segment ID: ${segment.id}`);
    }
    segmentIds.add(segment.id);

    // At least one range required
    if (!segment.byte_range && !segment.line_range) {
      errors.push(`Segment ${segment.id} must have byte_range or line_range`);
    }

    // Validate boost
    if (segment.boost !== undefined && (segment.boost < 0 || segment.boost > 10)) {
      errors.push(`Invalid boost for ${segment.id}: must be 0-10`);
    }

    // Validate token configs
    if (segment.return?.min_tokens !== undefined && segment.return.min_tokens < 1) {
      errors.push(`Invalid return.min_tokens for ${segment.id}: must be positive`);
    }
    if (segment.return?.max_tokens !== undefined && segment.return.max_tokens < 1) {
      errors.push(`Invalid return.max_tokens for ${segment.id}: must be positive`);
    }
    if (segment.generate?.min_tokens !== undefined && segment.generate.min_tokens < 1) {
      errors.push(`Invalid generate.min_tokens for ${segment.id}: must be positive`);
    }
    if (segment.generate?.max_tokens !== undefined && segment.generate.max_tokens < 1) {
      errors.push(`Invalid generate.max_tokens for ${segment.id}: must be positive`);
    }

    // Validate temperature
    if (segment.generate?.temperature !== undefined) {
      if (segment.generate.temperature < 0 || segment.generate.temperature > 2) {
        errors.push(`Invalid temperature for ${segment.id}: must be 0.0-2.0`);
      }
    }
  }

  return errors;
}

export function extractSegmentContent(
  source: string,
  segment: AnnotatedSegment
): string | null {
  if (segment.line_range) {
    const lines = source.split('\n');
    return lines
      .slice(segment.line_range.start - 1, segment.line_range.end)
      .join('\n');
  }

  if (segment.byte_range) {
    return source.substring(segment.byte_range.start, segment.byte_range.end);
  }

  return null;
}

export function validateSegmentChecksum(
  source: string,
  segment: AnnotatedSegment,
  sha256Fn: (content: string) => string
): boolean {
  if (!segment.segment_checksum) return true;

  const content = extractSegmentContent(source, segment);
  if (!content) return false;

  const actualChecksum = `sha256:${sha256Fn(content)}`;
  return segment.segment_checksum === actualChecksum;
}
