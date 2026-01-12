/**
 * StrongLink registry implementation
 */

import type { LinkTarget, LinkRegistry } from './types.js';

/**
 * In-memory link registry
 */
export class Registry implements LinkRegistry {
  links: Map<string, LinkTarget>;

  constructor() {
    this.links = new Map();
  }

  register(id: string, target: LinkTarget): void {
    this.links.set(id, { ...target, id });
  }

  resolve(id: string): LinkTarget | null {
    return this.links.get(id) || null;
  }

  has(id: string): boolean {
    return this.links.has(id);
  }

  all(): LinkTarget[] {
    return Array.from(this.links.values());
  }

  /**
   * Load links from a configuration object
   */
  loadFromConfig(config: Record<string, Omit<LinkTarget, 'id'>>): void {
    Object.entries(config).forEach(([id, target]) => {
      this.register(id, { ...target, id });
    });
  }

  /**
   * Find links by segment reference
   */
  findBySegmentRef(segmentRef: string): LinkTarget[] {
    return Array.from(this.links.values()).filter(
      (link) => link.segmentRef === segmentRef
    );
  }

  /**
   * Find links by page reference
   */
  findByPageRef(pageRef: string): LinkTarget[] {
    return Array.from(this.links.values()).filter(
      (link) => link.pageRef === pageRef
    );
  }
}

/**
 * Create a link registry from configuration
 */
export function createRegistry(
  config?: Record<string, Omit<LinkTarget, 'id'>>
): Registry {
  const registry = new Registry();
  if (config) {
    registry.loadFromConfig(config);
  }
  return registry;
}
