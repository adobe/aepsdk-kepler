#!/usr/bin/bash
# Copyright 2026 Adobe. All rights reserved.
# This file is licensed to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License. You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
# OF ANY KIND, either express or implied. See the License for the specific language
# governing permissions and limitations under the License.

# Local release checklist: bump version strings, build, test, sample app.
# Usage: ./scripts/release-sdk.sh [newVersion]
#   newVersion defaults to 1.0.1 if omitted only when you intend to sync — typically pass explicitly.
#
# Does NOT run npm publish (run manually after review):
#   cd packages/core && npm publish --access public
#   cd packages/media && npm publish --access public

set -euo pipefail

NEW_VERSION="${1:-}"
if [[ -z "${NEW_VERSION}" ]]; then
  echo "Usage: $0 <newVersion>"
  echo "Example: $0 1.0.1"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

echo "==> sync-sdk-version ${NEW_VERSION}"
node scripts/sync-sdk-version.cjs "${NEW_VERSION}"

echo "==> yarn build_all"
yarn build_all

echo "==> yarn unit_test"
yarn unit_test

echo "==> yarn build_sample_app"
yarn build_sample_app

echo ""
echo "Release prep complete for ${NEW_VERSION}."
echo "Publish to npm (when ready):"
echo "  cd packages/core && npm publish --access public --registry=https://registry.npmjs.org/"
echo "  cd packages/media && npm publish --access public --registry=https://registry.npmjs.org/"
