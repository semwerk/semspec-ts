import { parseSegments, validateSegments, findSegment, extractSegmentContent } from '../src/segments';

describe('Segment Parser', () => {
  const sampleMarkdown = `# Documentation

<!--semcontext:segment start key="overview" type="overview" audience="user,developer"-->
## Overview

This is an overview section.
<!--semcontext:segment end-->

Some content between segments.

<!--semcontext:segment start key="api-ref" type="reference"-->
## API Reference

API documentation here.
<!--semcontext:segment end-->
`;

  test('should parse segment markers', () => {
    const segments = parseSegments(sampleMarkdown);

    expect(segments).toHaveLength(2);
    expect(segments[0].key).toBe('overview');
    expect(segments[0].type).toBe('overview');
    expect(segments[0].audience).toEqual(['user', 'developer']);
    expect(segments[1].key).toBe('api-ref');
  });

  test('should extract segment content', () => {
    const segments = parseSegments(sampleMarkdown);

    expect(segments[0].content).toContain('## Overview');
    expect(segments[0].content).toContain('This is an overview section.');
    expect(segments[1].content).toContain('## API Reference');
  });

  test('should validate unique keys', () => {
    const segments = parseSegments(sampleMarkdown);
    const errors = validateSegments(segments);

    expect(errors).toHaveLength(0);
  });

  test('should detect duplicate keys', () => {
    const duplicate = `<!--semcontext:segment start key="test"-->
Content 1
<!--semcontext:segment end-->

<!--semcontext:segment start key="test"-->
Content 2
<!--semcontext:segment end-->
`;

    const segments = parseSegments(duplicate);
    const errors = validateSegments(segments);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Duplicate segment key');
  });

  test('should find segment by key', () => {
    const segments = parseSegments(sampleMarkdown);
    const segment = findSegment(segments, 'overview');

    expect(segment).not.toBeNull();
    expect(segment?.key).toBe('overview');
    expect(segment?.type).toBe('overview');
  });

  test('should return null for non-existent key', () => {
    const segments = parseSegments(sampleMarkdown);
    const segment = findSegment(segments, 'nonexistent');

    expect(segment).toBeNull();
  });

  test('should extract segment content by key', () => {
    const content = extractSegmentContent(sampleMarkdown, 'overview');

    expect(content).toContain('## Overview');
    expect(content).toContain('This is an overview section.');
  });

  test('should throw error on nested segments', () => {
    const nested = `<!--semcontext:segment start key="outer"-->
<!--semcontext:segment start key="inner"-->
Content
<!--semcontext:segment end-->
<!--semcontext:segment end-->
`;

    expect(() => parseSegments(nested)).toThrow('Nested segment markers');
  });

  test('should throw error on unclosed segment', () => {
    const unclosed = `<!--semcontext:segment start key="test"-->
Content without end marker
`;

    expect(() => parseSegments(unclosed)).toThrow('Unclosed segment marker');
  });

  test('should throw error on unmatched end marker', () => {
    const unmatched = `Some content
<!--semcontext:segment end-->
`;

    expect(() => parseSegments(unmatched)).toThrow('Unmatched end marker');
  });
});
