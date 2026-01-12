import fs from 'fs';
import path from 'path';
import { parseLinkage, validateLinkage, validateBidirectionalConsistency } from './linkage';
import { parseSegments, validateSegments } from './segments';
import { parseFrontmatter, validateFrontmatter } from './frontmatter';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  file: string;
  message: string;
  line?: number;
}

export interface ValidationWarning {
  file: string;
  message: string;
}

export function validateAll(directory: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate linkage.yaml
  const linkagePath = path.join(directory, 'linkage.yaml');
  if (fs.existsSync(linkagePath)) {
    try {
      const content = fs.readFileSync(linkagePath, 'utf-8');
      const linkage = parseLinkage(content);

      if (!validateLinkage(linkage)) {
        errors.push({
          file: linkagePath,
          message: 'Linkage schema validation failed',
        });
      }

      // Check bidirectional consistency
      const consistencyErrors = validateBidirectionalConsistency(linkage);
      consistencyErrors.forEach(msg =>
        errors.push({ file: linkagePath, message: msg })
      );
    } catch (err) {
      errors.push({
        file: linkagePath,
        message: `Parse error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Validate markdown files with segments
  const mdFiles = findMarkdownFiles(directory);
  for (const mdFile of mdFiles) {
    try {
      const content = fs.readFileSync(mdFile, 'utf-8');

      // Validate frontmatter
      const { frontmatter } = parseFrontmatter(content);
      if (frontmatter) {
        const fmErrors = validateFrontmatter(frontmatter);
        fmErrors.forEach(msg =>
          errors.push({ file: mdFile, message: msg })
        );
      }

      // Validate segments
      const segments = parseSegments(content);
      const segErrors = validateSegments(segments);
      segErrors.forEach(msg =>
        errors.push({ file: mdFile, message: msg })
      );
    } catch (err) {
      errors.push({
        file: mdFile,
        message: `Parse error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function findMarkdownFiles(directory: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(directory);
  return files;
}
