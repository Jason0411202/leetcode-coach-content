#!/usr/bin/env node
/**
 * Validate every problem JSON file against schemas/problem.schema.json,
 * and check that manifest.json is consistent with the file system.
 *
 * Usage:  node scripts/validate.mjs
 * Exits:  0 = all valid, 1 = one or more failures
 *
 * No external dependencies — uses a minimal hand-rolled JSON-Schema subset
 * sufficient for our schema (type, const, enum, required, properties,
 * minItems, maxItems, minLength, items, pattern).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROBLEMS_DIR = join(ROOT, 'problems');
const SCHEMA_PATH = join(ROOT, 'schemas', 'problem.schema.json');
const MANIFEST_PATH = join(ROOT, 'manifest.json');

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function validate(value, schema, path = '$') {
  const errors = [];

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`);
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual =
      value === null ? 'null' :
      Array.isArray(value) ? 'array' :
      typeof value === 'number' && Number.isInteger(value) ? 'integer' :
      typeof value;
    const ok = types.some(t =>
      t === actual ||
      (t === 'number' && actual === 'integer') ||
      (t === 'integer' && actual === 'number' && Number.isInteger(value))
    );
    if (!ok) errors.push(`${path}: expected type ${types.join('|')}, got ${actual}`);
  }

  if (schema.type === 'string' && typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: minLength ${schema.minLength}, got ${value.length}`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: pattern ${schema.pattern} not matched`);
    }
  }

  if (schema.type === 'array' && Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: minItems ${schema.minItems}, got ${value.length}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path}: maxItems ${schema.maxItems}, got ${value.length}`);
    }
    if (schema.items) {
      value.forEach((item, i) => {
        errors.push(...validate(item, schema.items, `${path}[${i}]`));
      });
    }
  }

  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    if (schema.required) {
      for (const k of schema.required) {
        if (!(k in value)) errors.push(`${path}: missing required field '${k}'`);
      }
    }
    if (schema.properties) {
      for (const [k, subSchema] of Object.entries(schema.properties)) {
        if (k in value) {
          errors.push(...validate(value[k], subSchema, `${path}.${k}`));
        }
      }
    }
  }

  return errors;
}

function checkHtmlSafety(html, path) {
  const errors = [];
  if (/<script\b/i.test(html)) {
    errors.push(`${path}: HTML must not contain <script> tags`);
  }
  if (/\son[a-z]+\s*=/i.test(html)) {
    errors.push(`${path}: HTML must not contain inline event handlers (on*=)`);
  }
  return errors;
}

const schema = loadJson(SCHEMA_PATH);
const manifest = loadJson(MANIFEST_PATH);

const problemFiles = readdirSync(PROBLEMS_DIR).filter(f => f.endsWith('.json'));
const slugsOnDisk = new Set(problemFiles.map(f => f.replace(/\.json$/, '')));
const slugsInManifest = new Set(manifest.problems.map(p => p.slug));

let totalErrors = 0;

console.log(`Validating ${problemFiles.length} problem(s)...\n`);

for (const file of problemFiles) {
  const path = join(PROBLEMS_DIR, file);
  const slug = file.replace(/\.json$/, '');
  let data;
  try {
    data = loadJson(path);
  } catch (e) {
    console.error(`✗ ${file}: invalid JSON — ${e.message}`);
    totalErrors++;
    continue;
  }

  const errors = validate(data, schema, slug);

  if (data.slug && data.slug !== slug) {
    errors.push(`slug mismatch: filename '${slug}' but data.slug = '${data.slug}'`);
  }

  for (const f of ['explanation_html', 'solution_html']) {
    if (typeof data[f] === 'string') {
      errors.push(...checkHtmlSafety(data[f], `${slug}.${f}`));
    }
  }
  if (Array.isArray(data.hints_html)) {
    data.hints_html.forEach((h, i) => {
      if (typeof h === 'string') errors.push(...checkHtmlSafety(h, `${slug}.hints_html[${i}]`));
    });
  }

  if (errors.length === 0) {
    console.log(`✓ ${file}`);
  } else {
    console.error(`✗ ${file}`);
    errors.forEach(e => console.error(`    ${e}`));
    totalErrors += errors.length;
  }
}

console.log('\nManifest consistency:');
const manifestErrors = [];
for (const slug of slugsOnDisk) {
  if (!slugsInManifest.has(slug)) {
    manifestErrors.push(`'${slug}' exists on disk but missing from manifest.json`);
  }
}
for (const slug of slugsInManifest) {
  if (!slugsOnDisk.has(slug)) {
    manifestErrors.push(`'${slug}' in manifest.json but no file on disk`);
  }
}
if (manifestErrors.length === 0) {
  console.log('  ✓ manifest.json is consistent with problems/ directory');
} else {
  manifestErrors.forEach(e => console.error(`  ✗ ${e}`));
  totalErrors += manifestErrors.length;
}

if (totalErrors === 0) {
  console.log(`\n✅ All checks passed.`);
  process.exit(0);
} else {
  console.error(`\n❌ ${totalErrors} error(s) found.`);
  process.exit(1);
}
