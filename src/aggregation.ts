import crypto from 'crypto';
import { ExternalAnnotations, AnnotatedSegment } from './annotations';

export interface PageAggregation {
  concepts: string[];
  audience_role: string[];
  semantics: Record<string, string[]>;
  token_budget: {
    total_return_max: number;
    total_return_min: number;
    total_generate_max?: number;
    total_generate_min?: number;
  };
  average_boost: number;
  segment_count: number;
  segment_checksums: string[];
  page_checksum: string;
}

export interface ProjectAggregation {
  project: string;
  project_version?: string;
  project_aggregation: {
    concepts: string[];
    audience_role: string[];
    semantics: Record<string, string[]>;
    token_budget: {
      total_return_max: number;
      total_return_min: number;
      total_generate_max?: number;
      total_generate_min?: number;
    };
    average_boost: number;
    page_count: number;
    segment_count: number;
    page_checksums: string[];
    project_checksum: string;
  };
  pages: PageSummary[];
}

export interface PageSummary {
  source_file: string;
  page_aggregation: PageAggregation;
}

export function aggregatePageMetadata(annotations: ExternalAnnotations): PageAggregation {
  const concepts = new Set<string>();
  const audienceRoles = new Set<string>();
  const semantics: Record<string, Set<string>> = {
    tasks: new Set(),
    problems: new Set(),
    solutions: new Set(),
    outcomes: new Set(),
    validations: new Set(),
    next_steps: new Set(),
    impacts: new Set(),
    features: new Set(),
  };

  let totalReturnMax = 0;
  let totalReturnMin = 0;
  let totalGenerateMax = 0;
  let totalGenerateMin = 0;
  let weightedBoostSum = 0;
  let totalTokens = 0;
  const segmentChecksums: string[] = [];

  // Aggregate content-level semantics
  if (annotations.semantics) {
    Object.entries(annotations.semantics).forEach(([key, values]) => {
      if (values && semantics[key]) {
        values.forEach(v => semantics[key].add(v));
      }
    });
  }

  for (const segment of annotations.segments) {
    // Aggregate concepts
    if (segment.concepts) {
      const conceptList = Array.isArray(segment.concepts)
        ? segment.concepts
        : [segment.concepts];
      conceptList.forEach(c => concepts.add(c));
    }

    // Aggregate audience roles
    if (segment.audience_role) {
      const roleList = Array.isArray(segment.audience_role)
        ? segment.audience_role
        : [segment.audience_role];
      roleList.forEach(r => audienceRoles.add(r));
    }

    // Aggregate segment semantics
    if (segment.semantics) {
      Object.entries(segment.semantics).forEach(([key, values]) => {
        if (values && Array.isArray(values) && semantics[key]) {
          values.forEach(v => semantics[key].add(v));
        }
      });
    }

    // Aggregate token budgets
    if (segment.return?.max_tokens) {
      totalReturnMax += segment.return.max_tokens;
      totalTokens += segment.return.max_tokens;
    }
    if (segment.return?.min_tokens) {
      totalReturnMin += segment.return.min_tokens;
    }
    if (segment.generate?.max_tokens) {
      totalGenerateMax += segment.generate.max_tokens;
    }
    if (segment.generate?.min_tokens) {
      totalGenerateMin += segment.generate.min_tokens;
    }

    // Weighted boost
    const segmentTokens = segment.return?.max_tokens || 0;
    const boost = segment.boost || 1.0;
    weightedBoostSum += boost * segmentTokens;

    // Collect checksums
    if (segment.segment_checksum) {
      segmentChecksums.push(segment.segment_checksum);
    }
  }

  // Calculate combined page checksum
  const pageChecksum = segmentChecksums.length > 0
    ? `sha256:${crypto.createHash('sha256').update(segmentChecksums.join('|')).digest('hex')}`
    : '';

  return {
    concepts: Array.from(concepts),
    audience_role: Array.from(audienceRoles),
    semantics: Object.fromEntries(
      Object.entries(semantics)
        .filter(([_, set]) => set.size > 0)
        .map(([key, set]) => [key, Array.from(set)])
    ),
    token_budget: {
      total_return_max: totalReturnMax,
      total_return_min: totalReturnMin,
      total_generate_max: totalGenerateMax || undefined,
      total_generate_min: totalGenerateMin || undefined,
    },
    average_boost: totalTokens > 0 ? weightedBoostSum / totalTokens : 1.0,
    segment_count: annotations.segments.length,
    segment_checksums: segmentChecksums,
    page_checksum: pageChecksum,
  };
}

export function aggregateProjectMetadata(
  pages: ExternalAnnotations[],
  projectId: string,
  projectVersion?: string
): ProjectAggregation {
  const concepts = new Set<string>();
  const audienceRoles = new Set<string>();
  const semantics: Record<string, Set<string>> = {
    tasks: new Set(),
    problems: new Set(),
    solutions: new Set(),
    outcomes: new Set(),
    features: new Set(),
    personas: new Set(),
  };

  let totalReturnMax = 0;
  let totalReturnMin = 0;
  let totalGenerateMax = 0;
  let totalGenerateMin = 0;
  let weightedBoostSum = 0;
  let totalTokens = 0;
  let totalSegments = 0;
  const pageChecksums: string[] = [];
  const pageSummaries: PageSummary[] = [];

  for (const page of pages) {
    const pageAgg = aggregatePageMetadata(page);

    // Aggregate to project level
    pageAgg.concepts.forEach(c => concepts.add(c));
    pageAgg.audience_role.forEach(r => audienceRoles.add(r));

    Object.entries(pageAgg.semantics).forEach(([key, values]) => {
      if (!semantics[key]) semantics[key] = new Set();
      values.forEach(v => semantics[key].add(v));
    });

    totalReturnMax += pageAgg.token_budget.total_return_max;
    totalReturnMin += pageAgg.token_budget.total_return_min;
    totalGenerateMax += pageAgg.token_budget.total_generate_max || 0;
    totalGenerateMin += pageAgg.token_budget.total_generate_min || 0;

    weightedBoostSum += pageAgg.average_boost * pageAgg.token_budget.total_return_max;
    totalTokens += pageAgg.token_budget.total_return_max;
    totalSegments += pageAgg.segment_count;

    pageChecksums.push(pageAgg.page_checksum);

    pageSummaries.push({
      source_file: page.source_file,
      page_aggregation: pageAgg,
    });
  }

  // Calculate project checksum
  const projectChecksum = `sha256:${crypto.createHash('sha256').update(pageChecksums.join('|')).digest('hex')}`;

  return {
    project: projectId,
    project_version: projectVersion,
    project_aggregation: {
      concepts: Array.from(concepts),
      audience_role: Array.from(audienceRoles),
      semantics: Object.fromEntries(
        Object.entries(semantics)
          .filter(([_, set]) => set.size > 0)
          .map(([key, set]) => [key, Array.from(set)])
      ),
      token_budget: {
        total_return_max: totalReturnMax,
        total_return_min: totalReturnMin,
        total_generate_max: totalGenerateMax || undefined,
        total_generate_min: totalGenerateMin || undefined,
      },
      average_boost: totalTokens > 0 ? weightedBoostSum / totalTokens : 1.0,
      page_count: pages.length,
      segment_count: totalSegments,
      page_checksums: pageChecksums,
      project_checksum: projectChecksum,
    },
    pages: pageSummaries,
  };
}
