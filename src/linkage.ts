import yaml from 'js-yaml';
import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

export interface Linkage {
  version: string;
  created_at?: string;
  updated_at?: string;
  meta?: {
    source?: string;
  };
  code_to_assets: Record<string, CodeMapping>;
  asset_to_code: Record<string, AssetMapping>;
}

export interface CodeMapping {
  created_at?: string;
  updated_at?: string;
  assets: Asset[];
}

export interface Asset {
  path: string;
  segments?: Segment[];
  relevance: 'primary' | 'supporting' | 'related';
  doc_type: string;
}

export interface Segment {
  id: string;
  heading: string;
  lines: [number, number];
}

export interface AssetMapping {
  code_refs: CodeRef[];
}

export interface CodeRef {
  path: string;
  functions: string[];
  lines: [number, number];
}

const ajv = new Ajv();

// Load schema from spec repository
const schemaPath = path.join(__dirname, '../../node_modules/@semwerk/spec/formats/linkage-mapping-schema.json');
let linkageSchema: any;

try {
  linkageSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
} catch {
  // Fallback: inline minimal schema for development
  linkageSchema = {
    type: 'object',
    required: ['version', 'code_to_assets', 'asset_to_code'],
    properties: {
      version: { type: 'string' },
      code_to_assets: { type: 'object' },
      asset_to_code: { type: 'object' },
    },
  };
}

const validateSchema = ajv.compile(linkageSchema);

export function parseLinkage(yamlContent: string): Linkage {
  const parsed = yaml.load(yamlContent) as Linkage;
  return parsed;
}

export function validateLinkage(linkage: Linkage): boolean {
  return validateSchema(linkage) as boolean;
}

export function findDocsForSymbol(linkage: Linkage, symbol: string): Asset[] {
  const mapping = linkage.code_to_assets[symbol];
  return mapping?.assets || [];
}

export function findCodeForDoc(linkage: Linkage, docPath: string): CodeRef[] {
  const mapping = linkage.asset_to_code[docPath];
  return mapping?.code_refs || [];
}

export function validateBidirectionalConsistency(linkage: Linkage): string[] {
  const errors: string[] = [];

  // Check code_to_assets references exist in asset_to_code
  for (const [symbol, mapping] of Object.entries(linkage.code_to_assets)) {
    for (const asset of mapping.assets) {
      if (!linkage.asset_to_code[asset.path]) {
        errors.push(`Missing reverse mapping: ${asset.path} not in asset_to_code`);
      }
    }
  }

  // Check asset_to_code references exist in code_to_assets
  for (const [docPath, mapping] of Object.entries(linkage.asset_to_code)) {
    for (const codeRef of mapping.code_refs) {
      for (const func of codeRef.functions) {
        const symbol = `${codeRef.path}:${func}`;
        if (!linkage.code_to_assets[symbol]) {
          errors.push(`Missing forward mapping: ${symbol} not in code_to_assets`);
        }
      }
    }
  }

  return errors;
}
