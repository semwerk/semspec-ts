import yaml from 'js-yaml';

export interface Concept {
  id: string;
  key: string;
  name: string;
  description?: string;
  aliases?: string[];
  status: 'active' | 'deprecated' | 'proposed';
  source: 'manual' | 'discovered' | 'imported';
  confidence?: number;
  tags?: string[];
}

export interface ConceptRelationship {
  from: string;
  to: string;
  kind: 'parent' | 'related' | 'implements' | 'documents' | 'depends_on';
  weight: number;
  description?: string;
  bidirectional?: boolean;
}

export interface ConceptGraph {
  graph?: {
    id?: string;
    name?: string;
    description?: string;
  };
  concepts: Concept[];
  relationships: ConceptRelationship[];
  metadata?: Record<string, any>;
}

export interface ConceptDocument {
  version: string;
  kind: 'concept-graph';
  graph?: ConceptGraph['graph'];
  concepts: Concept[];
  relationships: ConceptRelationship[];
  metadata?: Record<string, any>;
}

export function parseConcepts(yamlContent: string): ConceptGraph {
  const doc = yaml.load(yamlContent) as ConceptDocument;
  return {
    graph: doc.graph,
    concepts: doc.concepts,
    relationships: doc.relationships,
    metadata: doc.metadata,
  };
}

export function validateConcepts(graph: ConceptGraph): string[] {
  const errors: string[] = [];

  const conceptIds = new Set<string>();
  for (const concept of graph.concepts) {
    if (!concept.id) errors.push('Concept ID is required');
    if (!concept.key) errors.push('Concept key is required');
    if (!concept.name) errors.push('Concept name is required');

    if (conceptIds.has(concept.id)) {
      errors.push(`Duplicate concept ID: ${concept.id}`);
    }
    conceptIds.add(concept.id);

    // Validate source/confidence pairing
    if (concept.source === 'discovered' && concept.confidence === undefined) {
      errors.push(`Discovered concept ${concept.id} must have confidence score`);
    }
    if (concept.source === 'manual' && concept.confidence !== undefined) {
      errors.push(`Manual concept ${concept.id} should not have confidence score`);
    }

    // Validate confidence range
    if (concept.confidence !== undefined && (concept.confidence < 0 || concept.confidence > 1)) {
      errors.push(`Invalid confidence for ${concept.id}: must be 0.0-1.0`);
    }
  }

  // Validate relationships
  for (const rel of graph.relationships) {
    if (!conceptIds.has(rel.from.replace(/^concept:@/, ''))) {
      errors.push(`Relationship references non-existent concept: ${rel.from}`);
    }
    if (!conceptIds.has(rel.to.replace(/^concept:@/, ''))) {
      errors.push(`Relationship references non-existent concept: ${rel.to}`);
    }

    if (rel.weight < 0 || rel.weight > 1) {
      errors.push(`Invalid relationship weight: must be 0.0-1.0`);
    }

    if (rel.from === rel.to) {
      errors.push('Self-referencing relationships not allowed');
    }
  }

  return errors;
}

export function buildConceptHierarchy(graph: ConceptGraph, rootKey: string): any {
  const root = graph.concepts.find(c => c.key === rootKey);
  if (!root) return null;

  const children = graph.relationships
    .filter(r => r.to === `concept:@${root.id}` && r.kind === 'parent')
    .map(r => {
      const childId = r.from.replace(/^concept:@/, '');
      const child = graph.concepts.find(c => c.id === childId);
      return child ? buildConceptHierarchy(graph, child.key) : null;
    })
    .filter(Boolean);

  return {
    concept: root,
    children,
  };
}
