import { parseJourney, validateJourney } from '../src/journeys';

describe('Journey Parser', () => {
  const sampleJourney = `version: "2"
kind: journey

journey:
  id: jrn_quickstart
  key: quickstart
  name: "Quick Start Journey"
  description: "Get started in 5 minutes"
  projects:
    - project:@prj_payment_api
  personas:
    - persona:@per_developer
  status: active

  nodes:
    - id: signup
      type: stage
      key: signup
      name: "Sign Up"
      position: {x: 100, y: 50}
      connections:
        - target_node_id: verify

    - id: verify
      type: milestone
      key: email-verified
      name: "Email Verified"
      position: {x: 100, y: 150}
      connections:
        - target_node_id: first-call

    - id: first-call
      type: stage
      key: first-api-call
      name: "First API Call"
      position: {x: 100, y: 250}
      code_refs:
        - code:@cfn_create_charge@v2.0.0/CreateCharge

  entry_points:
    - type: documentation
      description: "From docs"
      url: /docs/quickstart

  exit_points:
    - node: first-call
      type: success
      description: "Completed first call"

  success_metrics:
    - metric: time_to_first_call
      target: "< 30 minutes"
      type: time
`;

  test('should parse journey', () => {
    const journey = parseJourney(sampleJourney);

    expect(journey.id).toBe('jrn_quickstart');
    expect(journey.nodes).toHaveLength(3);
    expect(journey.entry_points).toHaveLength(1);
    expect(journey.exit_points).toHaveLength(1);
    expect(journey.success_metrics).toHaveLength(1);
  });

  test('should validate correct journey', () => {
    const journey = parseJourney(sampleJourney);
    const errors = validateJourney(journey);

    expect(errors).toHaveLength(0);
  });

  test('should detect duplicate node IDs', () => {
    const duplicate = `version: "2"
kind: journey
journey:
  id: jrn_test
  key: test
  name: Test
  projects: [project:@prj_test]
  status: active
  nodes:
    - id: node1
      type: stage
      key: step1
      name: Step 1
      connections: []
    - id: node1
      type: stage
      key: step2
      name: Step 2
      connections: []
`;

    const journey = parseJourney(duplicate);
    const errors = validateJourney(journey);

    expect(errors.some(e => e.includes('Duplicate node ID'))).toBe(true);
  });

  test('should detect cycles in journey graph', () => {
    const cyclic = `version: "2"
kind: journey
journey:
  id: jrn_test
  key: test
  name: Test
  projects: [project:@prj_test]
  status: active
  nodes:
    - id: a
      type: stage
      key: a
      name: A
      connections:
        - target_node_id: b
    - id: b
      type: stage
      key: b
      name: B
      connections:
        - target_node_id: c
    - id: c
      type: stage
      key: c
      name: C
      connections:
        - target_node_id: a
`;

    const journey = parseJourney(cyclic);
    const errors = validateJourney(journey);

    expect(errors.some(e => e.includes('cycles'))).toBe(true);
  });

  test('should parse decision node with conditions', () => {
    const decision = `version: "2"
kind: journey
journey:
  id: jrn_test
  key: test
  name: Test
  projects: [project:@prj_test]
  status: active
  nodes:
    - id: check
      type: decision
      key: experience-check
      name: "Check Experience"
      connections:
        - target_node_id: beginner
          label: "Beginner"
          condition: "experience == beginner"
        - target_node_id: advanced
          label: "Advanced"
          condition: "experience == advanced"
    - id: beginner
      type: stage
      key: beginner
      name: Beginner
      connections: []
    - id: advanced
      type: stage
      key: advanced
      name: Advanced
      connections: []
`;

    const journey = parseJourney(decision);
    expect(journey.nodes[0].type).toBe('decision');
    expect(journey.nodes[0].connections).toHaveLength(2);
    expect(journey.nodes[0].connections[0].condition).toBe('experience == beginner');
  });

  test('should parse jump_off node', () => {
    const jumpOff = `version: "2"
kind: journey
journey:
  id: jrn_test
  key: test
  name: Test
  projects: [project:@prj_test]
  status: active
  nodes:
    - id: jump
      type: jump_off
      key: jump-to-advanced
      name: "Jump to Advanced"
      connections:
        - target_journey: journey:@jrn_advanced
          label: "Continue"
`;

    const journey = parseJourney(jumpOff);
    expect(journey.nodes[0].type).toBe('jump_off');
    expect(journey.nodes[0].connections[0].target_journey).toBe('journey:@jrn_advanced');
  });
});
