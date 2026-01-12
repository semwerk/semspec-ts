import yaml from 'js-yaml';

export interface ProjectVersion {
  id: string;
  project: string;
  key: string;
  name: string;
  mode: 'semver' | 'freeform';
  semver?: {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  };
  freeform?: {
    version: string;
  };
  status: 'draft' | 'alpha' | 'beta' | 'rc' | 'supported' | 'deprecated' | 'eol';
  type?: 'major_release' | 'minor_release' | 'patch_release' | 'hotfix';
  release_date?: string;
  eol_date?: string;
  is_default?: boolean;
  is_latest?: boolean;
  is_prerelease?: boolean;
  parent_version?: string;
  lineage_type?: 'ancestor' | 'descendant' | 'fork' | 'merge' | 'branch' | 'port';
  source_commit?: string;
  source_tag?: string;
  release_notes?: string;
  breaking_changes?: string[];
  metadata?: Record<string, any>;
}

export interface VersionDocument {
  version: string;
  kind: 'project-version';
  project_version: ProjectVersion;
}

export function parseVersion(yamlContent: string): ProjectVersion {
  const doc = yaml.load(yamlContent) as VersionDocument;
  return doc.project_version;
}

export function validateVersion(version: ProjectVersion): string[] {
  const errors: string[] = [];

  if (!version.id) errors.push('Version ID is required');
  if (!version.key) errors.push('Version key is required');
  if (!version.mode) errors.push('Versioning mode is required');

  if (version.mode === 'semver') {
    if (!version.semver) {
      errors.push('Semver mode requires semver fields');
    } else {
      if (version.semver.major === undefined) errors.push('Major version required');
      if (version.semver.minor === undefined) errors.push('Minor version required');
      if (version.semver.patch === undefined) errors.push('Patch version required');
    }
  }

  if (version.mode === 'freeform') {
    if (!version.freeform?.version) {
      errors.push('Freeform mode requires version string');
    }
  }

  return errors;
}

export function formatSemver(semver: ProjectVersion['semver']): string {
  if (!semver) return '';
  let v = `${semver.major}.${semver.minor}.${semver.patch}`;
  if (semver.prerelease) v += `-${semver.prerelease}`;
  if (semver.build) v += `+${semver.build}`;
  return v;
}
