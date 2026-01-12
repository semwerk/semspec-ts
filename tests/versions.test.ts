import { parseVersion, validateVersion, formatSemver } from '../src/versions';

describe('Version Parser', () => {
  const sampleSemver = `version: "1"
kind: project-version

project_version:
  id: pv_v2_0_0
  project: project:@prj_payment_api
  key: v2-0-0
  name: "Version 2.0.0"
  mode: semver
  semver:
    major: 2
    minor: 0
    patch: 0
  status: supported
  release_date: "2024-01-15"
  is_latest: true
`;

  const sampleFreeform = `version: "1"
kind: project-version

project_version:
  id: pv_winter_2024
  project: project:@prj_product
  key: winter-2024
  name: "Winter 2024 Release"
  mode: freeform
  freeform:
    version: "Winter 2024"
  status: supported
`;

  test('should parse semver version', () => {
    const version = parseVersion(sampleSemver);

    expect(version.id).toBe('pv_v2_0_0');
    expect(version.mode).toBe('semver');
    expect(version.semver?.major).toBe(2);
    expect(version.semver?.minor).toBe(0);
    expect(version.semver?.patch).toBe(0);
    expect(version.status).toBe('supported');
  });

  test('should parse freeform version', () => {
    const version = parseVersion(sampleFreeform);

    expect(version.mode).toBe('freeform');
    expect(version.freeform?.version).toBe('Winter 2024');
  });

  test('should validate correct semver', () => {
    const version = parseVersion(sampleSemver);
    const errors = validateVersion(version);

    expect(errors).toHaveLength(0);
  });

  test('should detect missing semver fields', () => {
    const invalid = `version: "1"
kind: project-version
project_version:
  id: pv_test
  project: project:@prj_test
  key: test
  name: Test
  mode: semver
`;

    const version = parseVersion(invalid);
    const errors = validateVersion(version);

    expect(errors.some(e => e.includes('semver'))).toBe(true);
  });

  test('should format semver string', () => {
    const version = parseVersion(sampleSemver);
    const formatted = formatSemver(version.semver);

    expect(formatted).toBe('2.0.0');
  });

  test('should format semver with prerelease', () => {
    const prerelease = `version: "1"
kind: project-version
project_version:
  id: pv_v3_0_0_beta1
  project: project:@prj_test
  key: v3-0-0-beta-1
  name: "Version 3.0.0 Beta 1"
  mode: semver
  semver:
    major: 3
    minor: 0
    patch: 0
    prerelease: "beta.1"
  status: beta
`;

    const version = parseVersion(prerelease);
    const formatted = formatSemver(version.semver);

    expect(formatted).toBe('3.0.0-beta.1');
  });

  test('should parse version lineage', () => {
    const withLineage = `version: "1"
kind: project-version
project_version:
  id: pv_v2_1_0
  project: project:@prj_test
  key: v2-1-0
  name: "Version 2.1.0"
  mode: semver
  semver:
    major: 2
    minor: 1
    patch: 0
  status: supported
  parent_version: version:@pv_v2_0_0
  lineage_type: ancestor
`;

    const version = parseVersion(withLineage);
    expect(version.parent_version).toBe('version:@pv_v2_0_0');
    expect(version.lineage_type).toBe('ancestor');
  });
});
