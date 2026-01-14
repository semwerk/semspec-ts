import { parseFrontmatter, validateFrontmatter, extractSegmentDefinitions } from '../src/frontmatter';

describe('Frontmatter Parser', () => {
  const sampleMarkdown = `---
template_id: "@api-reference"

semcontext:
  segments:
    - id: overview
      type: overview
      audience_role: [user, developer]
      concepts: [auth, security]
      boost: 1.2
      return:
        max_tokens: 800
    - id: api-ref
      type: reference
      audience_role: developer
      concepts: auth
---

# Documentation Content

The actual markdown content goes here.
`;

  test('should parse frontmatter', () => {
    const { frontmatter, content } = parseFrontmatter(sampleMarkdown);

    expect(frontmatter).not.toBeNull();
    expect(frontmatter?.template_id).toBe('@api-reference');
    expect(frontmatter?.semcontext?.segments).toHaveLength(2);
    expect(content).toContain('# Documentation Content');
  });

  test('should extract segment definitions', () => {
    const { frontmatter } = parseFrontmatter(sampleMarkdown);
    const segments = extractSegmentDefinitions(frontmatter!);

    expect(segments).toHaveLength(2);
    expect(segments[0].id).toBe('overview');
    expect(segments[0].type).toBe('overview');
    expect(segments[0].boost).toBe(1.2);
    expect(segments[1].id).toBe('api-ref');
  });

  test('should validate correct frontmatter', () => {
    const { frontmatter } = parseFrontmatter(sampleMarkdown);
    const errors = validateFrontmatter(frontmatter!);

    expect(errors).toHaveLength(0);
  });

  test('should detect duplicate segment IDs', () => {
    const duplicate = `---
semcontext:
  segments:
    - id: test
      type: overview
    - id: test
      type: reference
---
`;

    const { frontmatter } = parseFrontmatter(duplicate);
    const errors = validateFrontmatter(frontmatter!);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Duplicate segment ID');
  });

  test('should validate boost range', () => {
    const invalid = `---
semcontext:
  segments:
    - id: test
      boost: 15.0
---
`;

    const { frontmatter } = parseFrontmatter(invalid);
    const errors = validateFrontmatter(frontmatter!);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Invalid boost');
  });

  test('should handle markdown without frontmatter', () => {
    const noFrontmatter = `# Just Content

No frontmatter here.
`;

    const { frontmatter, content } = parseFrontmatter(noFrontmatter);

    expect(frontmatter).toBeNull();
    expect(content).toBe(noFrontmatter);
  });

  test('should handle single audience_role as string', () => {
    const { frontmatter } = parseFrontmatter(sampleMarkdown);
    const segments = extractSegmentDefinitions(frontmatter!);

    expect(segments[1].audience_role).toBe('developer');
  });

  test('should handle concepts as array or string', () => {
    const { frontmatter } = parseFrontmatter(sampleMarkdown);
    const segments = extractSegmentDefinitions(frontmatter!);

    expect(segments[0].concepts).toEqual(['auth', 'security']);
    expect(segments[1].concepts).toBe('auth');
  });
});
