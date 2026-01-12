import { parseConcepts, validateConcepts, buildConceptHierarchy } from '../src/concepts';

describe('Concept Parser', () => {
  const sampleConcepts = `version: "1"
kind: concept-graph

concepts:
  - id: cpt_authentication
    key: authentication
    name: "Authentication"
    description: "User identity verification"
    aliases: [auth, login]
    status: active
    source: manual

  - id: cpt_oauth
    key: oauth
    name: "OAuth 2.0"
    status: active
    source: manual

  - id: cpt_jwt
    key: jwt
    name: "JWT"
    aliases: [jwt-token]
    status: active
    source: manual

relationships:
  - from: concept:@cpt_oauth
    to: concept:@cpt_authentication
    kind: parent
    weight: 1.0

  - from: concept:@cpt_jwt
    to: concept:@cpt_authentication
    kind: parent
    weight: 1.0

  - from: concept:@cpt_jwt
    to: concept:@cpt_oauth
    kind: implements
    weight: 0.8
`;

  test('should parse concept graph', () => {
    const graph = parseConcepts(sampleConcepts);

    expect(graph.concepts).toHaveLength(3);
    expect(graph.relationships).toHaveLength(3);
  });

  test('should validate correct concept graph', () => {
    const graph = parseConcepts(sampleConcepts);
    const errors = validateConcepts(graph);

    expect(errors).toHaveLength(0);
  });

  test('should detect duplicate concept IDs', () => {
    const duplicate = `version: "1"
kind: concept-graph
concepts:
  - id: cpt_test
    key: test1
    name: Test 1
    status: active
    source: manual
  - id: cpt_test
    key: test2
    name: Test 2
    status: active
    source: manual
relationships: []
`;

    const graph = parseConcepts(duplicate);
    const errors = validateConcepts(graph);

    expect(errors.some(e => e.includes('Duplicate concept ID'))).toBe(true);
  });

  test('should validate discovered concept has confidence', () => {
    const discovered = `version: "1"
kind: concept-graph
concepts:
  - id: cpt_discovered
    key: discovered
    name: Discovered
    status: active
    source: discovered
relationships: []
`;

    const graph = parseConcepts(discovered);
    const errors = validateConcepts(graph);

    expect(errors.some(e => e.includes('confidence'))).toBe(true);
  });

  test('should validate manual concept has no confidence', () => {
    const manual = `version: "1"
kind: concept-graph
concepts:
  - id: cpt_manual
    key: manual
    name: Manual
    status: active
    source: manual
    confidence: 0.8
relationships: []
`;

    const graph = parseConcepts(manual);
    const errors = validateConcepts(graph);

    expect(errors.some(e => e.includes('should not have confidence'))).toBe(true);
  });

  test('should detect self-referencing relationships', () => {
    const selfRef = `version: "1"
kind: concept-graph
concepts:
  - id: cpt_test
    key: test
    name: Test
    status: active
    source: manual
relationships:
  - from: concept:@cpt_test
    to: concept:@cpt_test
    kind: related
    weight: 1.0
`;

    const graph = parseConcepts(selfRef);
    const errors = validateConcepts(graph);

    expect(errors.some(e => e.includes('Self-referencing'))).toBe(true);
  });

  test('should build concept hierarchy', () => {
    const graph = parseConcepts(sampleConcepts);
    const hierarchy = buildConceptHierarchy(graph, 'authentication');

    expect(hierarchy).not.toBeNull();
    expect(hierarchy.concept.key).toBe('authentication');
    expect(hierarchy.children).toHaveLength(2);
  });
});
