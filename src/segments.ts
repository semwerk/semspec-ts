export interface ParsedSegment {
  key: string;
  type?: string;
  audience?: string[];
  content: string;
  startLine: number;
  endLine: number;
}

const START_PATTERN = /<!--semcontext:segment\s+start\s+key="([^"]+)"(?:\s+type="([^"]+)")?(?:\s+audience="([^"]+)")?\s*-->/g;
const END_PATTERN = /<!--semcontext:segment\s+end\s*-->/g;

export function parseSegments(markdown: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const lines = markdown.split('\n');

  let currentSegment: Partial<ParsedSegment> | null = null;
  let contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for start marker
    const startMatch = line.match(/<!--semcontext:segment\s+start\s+key="([^"]+)"(?:\s+type="([^"]+)")?(?:\s+audience="([^"]+)")?\s*-->/);

    if (startMatch) {
      if (currentSegment) {
        throw new Error(`Nested segment markers not allowed at line ${i + 1}`);
      }

      const [, key, type, audience] = startMatch;
      currentSegment = {
        key,
        type: type || undefined,
        audience: audience ? audience.split(',').map(a => a.trim()) : undefined,
        startLine: i + 1,
      };
      contentLines = [];
      continue;
    }

    // Check for end marker
    if (line.match(END_PATTERN)) {
      if (!currentSegment) {
        throw new Error(`Unmatched end marker at line ${i + 1}`);
      }

      segments.push({
        key: currentSegment.key!,
        type: currentSegment.type,
        audience: currentSegment.audience,
        content: contentLines.join('\n'),
        startLine: currentSegment.startLine!,
        endLine: i + 1,
      });

      currentSegment = null;
      contentLines = [];
      continue;
    }

    // Collect content if inside segment
    if (currentSegment) {
      contentLines.push(line);
    }
  }

  if (currentSegment) {
    throw new Error(`Unclosed segment marker: ${currentSegment.key}`);
  }

  return segments;
}

export function validateSegments(segments: ParsedSegment[]): string[] {
  const errors: string[] = [];
  const keys = new Set<string>();

  for (const seg of segments) {
    // Check for duplicate keys
    if (keys.has(seg.key)) {
      errors.push(`Duplicate segment key: ${seg.key}`);
    }
    keys.add(seg.key);

    // Validate required fields
    if (!seg.key) {
      errors.push(`Segment missing required 'key' field`);
    }
  }

  return errors;
}

export function findSegment(segments: ParsedSegment[], key: string): ParsedSegment | null {
  return segments.find(s => s.key === key) || null;
}

export function extractSegmentContent(markdown: string, key: string): string | null {
  const segments = parseSegments(markdown);
  const segment = findSegment(segments, key);
  return segment?.content || null;
}
