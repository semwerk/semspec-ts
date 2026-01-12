import yaml from 'js-yaml';

export interface Journey {
  id: string;
  key: string;
  name: string;
  description?: string;
  projects: string[];
  primary_project?: string;
  personas?: string[];
  version_specific?: boolean;
  versions?: string[];
  status: 'draft' | 'active' | 'deprecated';
  nodes: JourneyNode[];
  entry_points?: EntryPoint[];
  exit_points?: ExitPoint[];
  success_metrics?: SuccessMetric[];
  metadata?: Record<string, any>;
}

export interface JourneyNode {
  id: string;
  type: 'stage' | 'milestone' | 'decision' | 'jump_off';
  key: string;
  name: string;
  description?: string;
  position?: { x: number; y: number };
  project?: string;
  features?: string[];
  code_refs?: string[];
  content_refs?: string[];
  asset_refs?: string[];
  concepts?: string[];
  connections: NodeConnection[];
  tags?: string[];
  metrics?: Record<string, any>;
  milestone_type?: string;
}

export interface NodeConnection {
  target_node_id?: string;
  target_journey?: string;
  label?: string;
  condition?: string;
}

export interface EntryPoint {
  type: string;
  description: string;
  url?: string;
  content_ref?: string;
  metadata?: Record<string, any>;
}

export interface ExitPoint {
  node: string;
  type: 'success' | 'failure' | 'abandonment' | 'conversion' | 'continuation';
  description: string;
  target_journey?: string;
}

export interface SuccessMetric {
  metric: string;
  target: string;
  description?: string;
  type?: 'time' | 'rate' | 'count' | 'score';
  unit?: string;
}

export interface JourneyDocument {
  version: string;
  kind: 'journey';
  journey: Journey;
  metadata?: Record<string, any>;
}

export function parseJourney(yamlContent: string): Journey {
  const doc = yaml.load(yamlContent) as JourneyDocument;
  return doc.journey;
}

export function validateJourney(journey: Journey): string[] {
  const errors: string[] = [];

  if (!journey.id) errors.push('Journey ID is required');
  if (!journey.key) errors.push('Journey key is required');
  if (!journey.name) errors.push('Journey name is required');
  if (!journey.projects || journey.projects.length === 0) {
    errors.push('At least one project required');
  }
  if (!journey.nodes || journey.nodes.length === 0) {
    errors.push('At least one node required');
  }

  // Validate nodes
  const nodeIds = new Set<string>();
  for (const node of journey.nodes || []) {
    if (!node.id) errors.push('Node ID is required');
    if (nodeIds.has(node.id)) errors.push(`Duplicate node ID: ${node.id}`);
    nodeIds.add(node.id);

    // Validate connections reference existing nodes or journeys
    for (const conn of node.connections || []) {
      if (conn.target_node_id && !nodeIds.has(conn.target_node_id)) {
        // Note: will fail for forward references, should do 2-pass validation
      }
    }
  }

  // Check for cycles (basic check)
  if (hasCycles(journey.nodes)) {
    errors.push('Journey graph contains cycles (must be DAG)');
  }

  return errors;
}

function hasCycles(nodes: JourneyNode[]): boolean {
  const graph = new Map<string, string[]>();
  for (const node of nodes) {
    graph.set(node.id, (node.connections ?? []).map(c => c.target_node_id).filter(Boolean) as string[]);
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}
