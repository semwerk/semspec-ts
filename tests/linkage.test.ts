import { parseLinkage, validateLinkage, findDocsForSymbol, findCodeForDoc, validateBidirectionalConsistency } from '../src/linkage';

describe('Linkage Parser', () => {
  const sampleLinkage = `version: "1"
created_at: 2026-01-10T00:00:00Z
updated_at: 2026-01-10T00:00:00Z

code_to_assets:
  "src/auth/login.go:Authenticate":
    created_at: 2026-01-10T00:00:00Z
    updated_at: 2026-01-10T00:00:00Z
    assets:
      - path: docs/api/auth.md
        segments:
          - id: authenticate
            heading: "### Authenticate"
            lines: [45, 89]
        relevance: primary
        doc_type: reference

asset_to_code:
  "docs/api/auth.md":
    code_refs:
      - path: src/auth/login.go
        functions: [Authenticate]
        lines: [0, 0]
`;

  test('should parse valid linkage YAML', () => {
    const linkage = parseLinkage(sampleLinkage);

    expect(linkage.version).toBe('1');
    expect(linkage.code_to_assets).toBeDefined();
    expect(linkage.asset_to_code).toBeDefined();
  });

  test('should validate correct linkage structure', () => {
    const linkage = parseLinkage(sampleLinkage);
    expect(validateLinkage(linkage)).toBe(true);
  });

  test('should find docs for code symbol', () => {
    const linkage = parseLinkage(sampleLinkage);
    const docs = findDocsForSymbol(linkage, 'src/auth/login.go:Authenticate');

    expect(docs).toHaveLength(1);
    expect(docs[0].path).toBe('docs/api/auth.md');
    expect(docs[0].relevance).toBe('primary');
    expect(docs[0].doc_type).toBe('reference');
  });

  test('should find code for documentation', () => {
    const linkage = parseLinkage(sampleLinkage);
    const code = findCodeForDoc(linkage, 'docs/api/auth.md');

    expect(code).toHaveLength(1);
    expect(code[0].path).toBe('src/auth/login.go');
    expect(code[0].functions).toContain('Authenticate');
  });

  test('should validate bidirectional consistency', () => {
    const linkage = parseLinkage(sampleLinkage);
    const errors = validateBidirectionalConsistency(linkage);

    expect(errors).toHaveLength(0);
  });

  test('should detect missing reverse mapping', () => {
    const inconsistent = `version: "1"
code_to_assets:
  "test.go:Func":
    assets:
      - path: missing.md
        relevance: primary
        doc_type: reference
asset_to_code: {}
`;

    const linkage = parseLinkage(inconsistent);
    const errors = validateBidirectionalConsistency(linkage);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('missing.md');
  });

  test('should return empty array for non-existent symbol', () => {
    const linkage = parseLinkage(sampleLinkage);
    const docs = findDocsForSymbol(linkage, 'nonexistent:Symbol');

    expect(docs).toHaveLength(0);
  });
});
