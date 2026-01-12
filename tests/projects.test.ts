import { parseProject, validateProject } from '../src/projects';

describe('Project Parser', () => {
  const sampleProject = `version: "1"
kind: project

project:
  id: prj_payment_api
  key: payment-api
  name: "Payment API"
  type: service
  description: "Core payment processing service"
  status: active

  repositories:
    - id: repo_main
      url: github.com/acme/payment-api
      is_primary: true
      branch: main

  assets:
    - id: ast_docs
      type: documentation
      source: filesystem
      path: docs/
      is_primary: true

metadata:
  owner: payments-team
  tech_stack:
    - Go
    - gRPC
`;

  test('should parse valid project', () => {
    const project = parseProject(sampleProject);

    expect(project.id).toBe('prj_payment_api');
    expect(project.key).toBe('payment-api');
    expect(project.type).toBe('service');
    expect(project.repositories).toHaveLength(1);
    expect(project.assets).toHaveLength(1);
  });

  test('should validate correct project', () => {
    const project = parseProject(sampleProject);
    const errors = validateProject(project);

    expect(errors).toHaveLength(0);
  });

  test('should detect missing required fields', () => {
    const invalid = `version: "1"
kind: project
project:
  key: test
  type: service
`;

    const project = parseProject(invalid);
    const errors = validateProject(project);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('ID'))).toBe(true);
  });

  test('should detect invalid project type', () => {
    const invalid = `version: "1"
kind: project
project:
  id: prj_test
  key: test
  name: Test
  type: invalid-type
  status: active
`;

    const project = parseProject(invalid);
    const errors = validateProject(project);

    expect(errors.some(e => e.includes('Invalid project type'))).toBe(true);
  });

  test('should parse multi-repo project', () => {
    const multiRepo = `version: "1"
kind: project
project:
  id: prj_platform
  key: platform
  name: Platform
  type: platform
  status: active
  repositories:
    - id: repo_api
      url: github.com/acme/api
      is_primary: true
    - id: repo_sdk
      url: github.com/acme/sdk
      is_primary: false
`;

    const project = parseProject(multiRepo);
    expect(project.repositories).toHaveLength(2);
    expect(project.repositories![0].is_primary).toBe(true);
    expect(project.repositories![1].is_primary).toBe(false);
  });
});
