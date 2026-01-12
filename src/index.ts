// Linkage mapping
export {
  parseLinkage,
  validateLinkage,
  findDocsForSymbol,
  findCodeForDoc,
  validateBidirectionalConsistency,
  type Linkage,
  type CodeMapping,
  type Asset,
  type Segment,
  type AssetMapping,
  type CodeRef,
} from './linkage';

// Segment markers
export {
  parseSegments,
  validateSegments,
  findSegment,
  extractSegmentContent,
  type ParsedSegment,
} from './segments';

// Frontmatter
export {
  parseFrontmatter,
  validateFrontmatter,
  extractSegmentDefinitions,
  type Frontmatter,
  type SegmentDefinition,
  type ContentSemantics,
  type SegmentSemantics,
} from './frontmatter';

// Projects
export {
  parseProject,
  validateProject,
  type Project,
  type Repository,
  type Asset as ProjectAsset,
  type ProjectDocument,
} from './projects';

// Versions
export {
  parseVersion,
  validateVersion,
  formatSemver,
  type ProjectVersion,
  type Semver,
  type Freeform,
  type VersionDocument,
} from './versions';

// Journeys
export {
  parseJourney,
  validateJourney,
  type Journey,
  type JourneyNode,
  type NodeConnection,
  type EntryPoint,
  type ExitPoint,
  type SuccessMetric,
  type JourneyDocument,
} from './journeys';

// Concepts
export {
  parseConcepts,
  validateConcepts,
  buildConceptHierarchy,
  type Concept,
  type ConceptRelationship,
  type ConceptGraph,
  type ConceptDocument,
} from './concepts';

// External Annotations
export {
  parseExternalAnnotations,
  validateExternalAnnotations,
  extractSegmentContent as extractAnnotatedSegmentContent,
  validateSegmentChecksum,
  type ExternalAnnotations,
  type AnnotatedSegment,
  type ContentSemantics as AnnotationContentSemantics,
  type SegmentSemantics as AnnotationSegmentSemantics,
  type ByteRange,
  type LineRange,
  type TokenConfig,
  type GenerateConfig,
} from './annotations';

// Aggregation
export {
  aggregatePageMetadata,
  aggregateProjectMetadata,
  type PageAggregation,
  type ProjectAggregation,
  type PageSummary,
} from './aggregation';

// Validators
export { validateAll, type ValidationResult } from './validators';
