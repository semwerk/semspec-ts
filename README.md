# semspec-ts

TypeScript parsers and validators for [Semwerk specifications](https://github.com/semwerk/spec).

## Installation

```bash
npm install @semwerk/semspec
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## Usage

### Parse Linkage Mapping

```typescript
import { parseLinkage, validateLinkage } from '@semwerk/semspec';
import fs from 'fs';

const yaml = fs.readFileSync('.semcontext/linkage.yaml', 'utf-8');
const linkage = parseLinkage(yaml);

// Validate against schema
const valid = validateLinkage(linkage);
if (!valid) {
  console.error(validateLinkage.errors);
}

// Use linkage data
console.log(linkage.code_to_assets);
```

### Parse Segment Markers

```typescript
import { parseSegments } from '@semwerk/semspec';

const markdown = fs.readFileSync('README.md', 'utf-8');
const segments = parseSegments(markdown);

segments.forEach(seg => {
  console.log(`${seg.key}: ${seg.type} (audience: ${seg.audience})`);
  console.log(seg.content);
});
```

### Parse Frontmatter

```typescript
import { parseFrontmatter } from '@semwerk/semspec';

const markdown = fs.readFileSync('docs/api.md', 'utf-8');
const { frontmatter, content } = parseFrontmatter(markdown);

console.log(frontmatter.semcontext.segments);
```

### Validate Files

```typescript
import { validateAll } from '@semwerk/semspec';

const results = validateAll('.semcontext/');

if (results.errors.length > 0) {
  results.errors.forEach(err => console.error(err));
  process.exit(1);
}
```

## API

### Linkage

- `parseLinkage(yaml: string): Linkage` - Parse linkage.yaml
- `validateLinkage(linkage: Linkage): boolean` - Validate against schema
- `findDocsForSymbol(linkage: Linkage, symbol: string): Asset[]` - Find docs for code
- `findCodeForDoc(linkage: Linkage, docPath: string): CodeRef[]` - Find code for doc

### Segments

- `parseSegments(markdown: string): Segment[]` - Extract segment markers
- `validateSegments(segments: Segment[]): boolean` - Validate segments
- `findSegment(segments: Segment[], key: string): Segment | null` - Find by key
- `extractSegmentContent(markdown: string, key: string): string` - Get segment content

### Frontmatter

- `parseFrontmatter(markdown: string): { frontmatter: any, content: string }` - Parse YAML frontmatter
- `validateFrontmatter(frontmatter: any): boolean` - Validate against schema
- `extractSegmentDefinitions(frontmatter: any): SegmentDef[]` - Get segment definitions

### Validators

- `validateAll(directory: string): ValidationResult` - Validate all files in directory
- `validateLinkageConsistency(linkage: Linkage): Issue[]` - Check bidirectional consistency

## CLI

```bash
# Validate linkage.yaml
npx @semwerk/semspec validate .semcontext/linkage.yaml

# Parse and display segments
npx @semwerk/semspec segments README.md

# Validate all files
npx @semwerk/semspec validate-all .semcontext/
```

## Specifications

This package implements:
- [Linkage Mapping](https://github.com/semwerk/spec/blob/main/formats/linkage-mapping.md)
- [Segment Markers](https://github.com/semwerk/spec/blob/main/formats/segment-markers.md)
- [Frontmatter](https://github.com/semwerk/spec/blob/main/formats/frontmatter.md)

See the [Semwerk Specification](https://github.com/semwerk/spec) repository for complete documentation.

## License

MIT
