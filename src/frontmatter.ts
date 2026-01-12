import yaml from 'js-yaml';

export interface Frontmatter {
  template_id?: string;
  werkcontext?: {
    semantics?: ContentSemantics;
    segments?: SegmentDefinition[];
  };
  [key: string]: any;
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

export interface SegmentDefinition {
  id: string;
  type?: string;
  audience_role?: string | string[];
  concepts?: string | string[];
  boost?: number;
  semantics?: SegmentSemantics;
  return?: {
    max_tokens?: number;
    min_tokens?: number;
  };
  generate?: {
    max_tokens?: number;
    min_tokens?: number;
    model?: string;
    temperature?: number;
    context?: string;
  };
}

export function parseFrontmatter(markdown: string): { frontmatter: Frontmatter | null; content: string } {
  const lines = markdown.split('\n');

  // Check for frontmatter delimiter
  if (lines[0] !== '---') {
    return { frontmatter: null, content: markdown };
  }

  // Find closing delimiter
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: null, content: markdown };
  }

  // Parse YAML
  const yamlContent = lines.slice(1, endIndex).join('\n');
  const frontmatter = yaml.load(yamlContent) as Frontmatter;

  // Extract remaining content
  const content = lines.slice(endIndex + 1).join('\n');

  return { frontmatter, content };
}

export function validateFrontmatter(frontmatter: Frontmatter): string[] {
  const errors: string[] = [];

  if (!frontmatter.werkcontext) {
    return errors; // Optional field
  }

  const segments = frontmatter.werkcontext.segments || [];
  const ids = new Set<string>();

  for (const seg of segments) {
    // Check required fields
    if (!seg.id) {
      errors.push('Segment missing required id field');
      continue;
    }

    // Check for duplicate IDs
    if (ids.has(seg.id)) {
      errors.push(`Duplicate segment ID: ${seg.id}`);
    }
    ids.add(seg.id);

    // Validate boost range
    if (seg.boost !== undefined && (seg.boost < 0 || seg.boost > 10)) {
      errors.push(`Invalid boost value for ${seg.id}: ${seg.boost} (must be 0-10)`);
    }

    // Validate token limits
    if (seg.return?.max_tokens !== undefined && seg.return.max_tokens < 1) {
      errors.push(`Invalid return.max_tokens for ${seg.id}: must be positive`);
    }
    if (seg.return?.min_tokens !== undefined && seg.return.min_tokens < 1) {
      errors.push(`Invalid return.min_tokens for ${seg.id}: must be positive`);
    }
    if (seg.generate?.max_tokens !== undefined && seg.generate.max_tokens < 1) {
      errors.push(`Invalid generate.max_tokens for ${seg.id}: must be positive`);
    }
    if (seg.generate?.min_tokens !== undefined && seg.generate.min_tokens < 1) {
      errors.push(`Invalid generate.min_tokens for ${seg.id}: must be positive`);
    }

    // Validate temperature
    if (seg.generate?.temperature !== undefined) {
      if (seg.generate.temperature < 0 || seg.generate.temperature > 2) {
        errors.push(`Invalid temperature for ${seg.id}: must be 0.0-2.0`);
      }
    }
  }

  return errors;
}

export function extractSegmentDefinitions(frontmatter: Frontmatter): SegmentDefinition[] {
  return frontmatter.werkcontext?.segments || [];
}
