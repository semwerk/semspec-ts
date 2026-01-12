import type { ParsedDoc, ValidationError } from './types.js';

/**
 * Validate a parsed document for segment consistency.
 *
 * Checks:
 * - Unique segment IDs
 * - Each segment has exactly one of return or generate
 * - All markers have corresponding specs
 * - All specs have corresponding markers
 * - Numeric values in valid ranges
 *
 * @param parsed - Parsed document
 * @returns Array of validation errors (empty if valid)
 */
export function validateSegments(parsed: ParsedDoc): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIDs = new Set<string>();

  // Check frontmatter segment specs
  if (parsed.frontmatter.semcontext?.segments) {
    for (const spec of parsed.frontmatter.semcontext.segments) {
      // Check for duplicate IDs
      if (seenIDs.has(spec.id)) {
        errors.push({
          segmentId: spec.id,
          field: 'id',
          message: 'duplicate segment ID in frontmatter',
        });
      }
      seenIDs.add(spec.id);

      // Check ID is not empty
      if (!spec.id) {
        errors.push({
          field: 'id',
          message: 'segment ID cannot be empty',
        });
        continue;
      }

      // Check exactly one of return or generate
      const hasReturn = !!spec.return;
      const hasGenerate = !!spec.generate;

      if (!hasReturn && !hasGenerate) {
        errors.push({
          segmentId: spec.id,
          message: "segment must have either 'return' or 'generate' configuration",
        });
      }

      if (hasReturn && hasGenerate) {
        errors.push({
          segmentId: spec.id,
          message: "segment cannot have both 'return' and 'generate' configuration",
        });
      }

      // Validate numeric ranges
      if (spec.return && spec.return.maxTokens < 0) {
        errors.push({
          segmentId: spec.id,
          field: 'return.max_tokens',
          message: 'max_tokens must be non-negative',
        });
      }

      if (spec.generate) {
        if (spec.generate.maxTokens < 0) {
          errors.push({
            segmentId: spec.id,
            field: 'generate.max_tokens',
            message: 'max_tokens must be non-negative',
          });
        }

        if (
          spec.generate.temperature !== undefined &&
          (spec.generate.temperature < 0 || spec.generate.temperature > 2.0)
        ) {
          errors.push({
            segmentId: spec.id,
            field: 'generate.temperature',
            message: 'temperature must be between 0.0 and 2.0',
          });
        }

        if (spec.generate.iterations !== undefined && spec.generate.iterations < 0) {
          errors.push({
            segmentId: spec.id,
            field: 'generate.iterations',
            message: 'iterations must be non-negative',
          });
        }
      }

      if (spec.boost !== undefined && spec.boost < 0) {
        errors.push({
          segmentId: spec.id,
          field: 'boost',
          message: 'boost must be non-negative',
        });
      }
    }
  }

  // Check segments found in content
  const markerIDs = new Set<string>();
  for (const seg of parsed.segments) {
    // Check for duplicate marker IDs
    if (markerIDs.has(seg.id)) {
      errors.push({
        segmentId: seg.id,
        message: 'duplicate segment ID in document markers',
      });
    }
    markerIDs.add(seg.id);

    // Check if marker has corresponding spec
    if (!seg.spec) {
      errors.push({
        segmentId: seg.id,
        message: 'segment marker has no corresponding frontmatter spec',
      });
    }
  }

  // Check for specs without markers
  if (parsed.frontmatter.semcontext?.segments) {
    for (const spec of parsed.frontmatter.semcontext.segments) {
      if (!markerIDs.has(spec.id)) {
        errors.push({
          segmentId: spec.id,
          message: 'frontmatter spec has no corresponding segment marker in document',
        });
      }
    }
  }

  return errors;
}

/**
 * Strict validation - all checks, missing specs/markers are errors.
 */
export function validateStrict(parsed: ParsedDoc): ValidationError[] {
  return validateSegments(parsed);
}

/**
 * Loose validation - only critical errors (duplicates, nesting, invalid configs).
 * Missing specs for markers or vice versa are allowed.
 */
export function validateLoose(parsed: ParsedDoc): ValidationError[] {
  const errors: ValidationError[] = [];
  const seenIDs = new Set<string>();

  if (parsed.frontmatter.semcontext?.segments) {
    for (const spec of parsed.frontmatter.semcontext.segments) {
      // Duplicate IDs
      if (seenIDs.has(spec.id)) {
        errors.push({
          segmentId: spec.id,
          field: 'id',
          message: 'duplicate segment ID in frontmatter',
        });
      }
      seenIDs.add(spec.id);

      // Check exactly one of return or generate
      const hasReturn = !!spec.return;
      const hasGenerate = !!spec.generate;

      if (hasReturn && hasGenerate) {
        errors.push({
          segmentId: spec.id,
          message: "segment cannot have both 'return' and 'generate' configuration",
        });
      }

      // Validate numeric ranges
      if (spec.return && spec.return.maxTokens < 0) {
        errors.push({
          segmentId: spec.id,
          field: 'return.max_tokens',
          message: 'max_tokens must be non-negative',
        });
      }

      if (spec.generate) {
        if (spec.generate.maxTokens < 0) {
          errors.push({
            segmentId: spec.id,
            field: 'generate.max_tokens',
            message: 'max_tokens must be non-negative',
          });
        }

        if (
          spec.generate.temperature !== undefined &&
          (spec.generate.temperature < 0 || spec.generate.temperature > 2.0)
        ) {
          errors.push({
            segmentId: spec.id,
            field: 'generate.temperature',
            message: 'temperature must be between 0.0 and 2.0',
          });
        }
      }

      if (spec.boost !== undefined && spec.boost < 0) {
        errors.push({
          segmentId: spec.id,
          field: 'boost',
          message: 'boost must be non-negative',
        });
      }
    }
  }

  // Check for duplicate marker IDs
  const markerIDs = new Set<string>();
  for (const seg of parsed.segments) {
    if (markerIDs.has(seg.id)) {
      errors.push({
        segmentId: seg.id,
        message: 'duplicate segment ID in document markers',
      });
    }
    markerIDs.add(seg.id);
  }

  return errors;
}
