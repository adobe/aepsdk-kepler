#!/usr/bin/env node
/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/**
 * Single place to bump the SDK semver for @adobe/vega-aepcore and @adobe/vega-aepmedia:
 * - packages/core and packages/media package.json "version"
 * - Runtime constants (CoreConstants, EdgeConstants, configuration Constants, MediaConstants)
 * - Unit/integration tests that assert the version string
 *
 * Usage:
 *   node scripts/sync-sdk-version.cjs <newVersion> [oldVersion]
 *
 * If oldVersion is omitted, it is read from packages/core/package.json before update.
 *
 * Example:
 *   node scripts/sync-sdk-version.cjs 1.0.1
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');

function readText(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function writeText(rel, content) {
  fs.writeFileSync(path.join(repoRoot, rel), content);
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function writeJson(rel, obj) {
  writeText(rel, JSON.stringify(obj, null, 2) + '\n');
}

const newVersion = process.argv[2];
let oldVersion = process.argv[3];

if (!newVersion || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(
    'Usage: node scripts/sync-sdk-version.cjs <newSemver> [oldSemver]\n' +
      'Example: node scripts/sync-sdk-version.cjs 1.0.1'
  );
  process.exit(1);
}

const corePkgPath = 'packages/core/package.json';
if (!oldVersion) {
  oldVersion = readJson(corePkgPath).version;
}

if (oldVersion === newVersion) {
  console.log(`[sync-sdk-version] Already at ${newVersion}; nothing to do.`);
  process.exit(0);
}

console.log(`[sync-sdk-version] ${oldVersion} -> ${newVersion}`);

/** @type {string[]} */
const textFiles = [
  'packages/core/src/core/CoreConstants.ts',
  'packages/core/src/edge/EdgeConstants.ts',
  'packages/core/src/configuration/Constants.ts',
  'packages/media/src/MediaConstants.ts',
  'packages/core/tests/edge/EdgeExtension.test.ts',
  'packages/core/tests/edge/EdgeHitProcessor.test.ts',
  'packages/core/tests/core/extension/Extension.test.ts',
  'packages/media/tests/MediaExtension.test.ts',
  'integrationTests/tests/core.test.ts',
  'integrationTests/src/test-utils/testData.ts',
  'integrationTests/src/index.ts',
];

for (const rel of textFiles) {
  const p = path.join(repoRoot, rel);
  if (!fs.existsSync(p)) {
    console.warn(`[sync-sdk-version] skip missing: ${rel}`);
    continue;
  }
  let content = fs.readFileSync(p, 'utf8');
  const before = content;
  content = content.split(oldVersion).join(newVersion);
  if (content !== before) {
    fs.writeFileSync(p, content);
    console.log(`  updated ${rel}`);
  }
}

// packages/core/package.json
const corePkg = readJson(corePkgPath);
corePkg.version = newVersion;
writeJson(corePkgPath, corePkg);

// packages/media/package.json
const mediaPkgPath = 'packages/media/package.json';
const mediaPkg = readJson(mediaPkgPath);
mediaPkg.version = newVersion;
if (mediaPkg.dependencies && mediaPkg.dependencies['@adobe/vega-aepcore']) {
  mediaPkg.dependencies['@adobe/vega-aepcore'] = `^${newVersion}`;
}
writeJson(mediaPkgPath, mediaPkg);

// integrationTests/package.json
const intPkgPath = 'integrationTests/package.json';
const intPkg = readJson(intPkgPath);
intPkg.version = newVersion;
if (intPkg.dependencies) {
  if (intPkg.dependencies['@adobe/vega-aepcore']) {
    intPkg.dependencies['@adobe/vega-aepcore'] = `^${newVersion}`;
  }
  if (intPkg.dependencies['@adobe/vega-aepmedia']) {
    intPkg.dependencies['@adobe/vega-aepmedia'] = `^${newVersion}`;
  }
}
writeJson(intPkgPath, intPkg);

console.log('[sync-sdk-version] Done. Run: yarn build_all && yarn unit_test');
