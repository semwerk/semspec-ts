import yaml from 'js-yaml';

export interface Project {
  id: string;
  key: string;
  name: string;
  type: 'product' | 'service' | 'library' | 'platform' | 'internal';
  description?: string;
  status: 'active' | 'archived';
  parent_project?: string;
  repositories?: Repository[];
  assets?: Asset[];
  metadata?: Record<string, any>;
}

export interface Repository {
  id: string;
  url: string;
  is_primary: boolean;
  path_filter?: string;
  branch?: string;
}

export interface Asset {
  id: string;
  type: 'documentation' | 'marketing' | 'operational' | 'legal';
  source: 'filesystem' | 'gdocs' | 'notion' | 'confluence';
  path: string;
  is_primary: boolean;
}

export interface ProjectDocument {
  version: string;
  kind: 'project';
  project: Project;
  metadata?: Record<string, any>;
}

export function parseProject(yamlContent: string): Project {
  const doc = yaml.load(yamlContent) as ProjectDocument;
  return doc.project;
}

export function validateProject(project: Project): string[] {
  const errors: string[] = [];

  if (!project.id) errors.push('Project ID is required');
  if (!project.key) errors.push('Project key is required');
  if (!project.name) errors.push('Project name is required');

  if (!['product', 'service', 'library', 'platform', 'internal'].includes(project.type)) {
    errors.push(`Invalid project type: ${project.type}`);
  }

  if (project.repositories && project.repositories.length === 0) {
    errors.push('At least one repository required');
  }

  return errors;
}
