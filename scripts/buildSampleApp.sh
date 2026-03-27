#!/bin/bash
# Copyright 2026 Adobe. All rights reserved.
# This file is licensed to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License. You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
# OF ANY KIND, either express or implied. See the License for the specific language
# governing permissions and limitations under the License.

# Exit on any error
set -e

echo "Building and archiving AEP Vega SDK packages..."

# Build and archive all packages
echo "Building and archiving packages..."
yarn archive_all

# Clean generated folders in the sample app
echo "Cleaning AEPSampleApp generated folders..."
rm -rf apps/AEPSampleApp/node_modules
rm -rf apps/AEPSampleApp/.vscode
rm -rf apps/AEPSampleApp/yarn.lock
rm -rf apps/AEPSampleApp/ios/build
rm -rf apps/AEPSampleApp/ios/Pods
rm -rf apps/AEPSampleApp/android/build
rm -rf apps/AEPSampleApp/android/app/build
rm -rf apps/AEPSampleApp/android/.gradle

# Clean and recreate libs directory
echo "Cleaning libs directory..."
rm -rf apps/AEPSampleApp/libs
mkdir -p apps/AEPSampleApp/libs

# Copy the archived packages to the sample app
# (yarn pack writes tarballs to each package dir with names like adobe-vega-aepcore-v1.0.0-beta.2.tgz)
echo "Copying SDK packages to sample app..."
cp packages/core/adobe-vega-aepcore-*.tgz apps/AEPSampleApp/libs/
cp packages/media/adobe-vega-aepmedia-*.tgz apps/AEPSampleApp/libs/

# Navigate to sample app directory
cd apps/AEPSampleApp

# Remove stale package-lock.json so npm doesn't use old integrity hashes for the file: tgz.
# Fresh yarn pack in CI can produce different tgz checksums than the committed lockfile.
rm -f package-lock.json

echo "[build_sample_app] Installing sample app dependencies in $(pwd)..."
[ -n "$NPM_TOKEN" ] && echo "[build_sample_app] WARNING: NPM_TOKEN is set (len=${#NPM_TOKEN})" || echo "[build_sample_app] NPM_TOKEN unset"
[ -n "$NODE_AUTH_TOKEN" ] && echo "[build_sample_app] WARNING: NODE_AUTH_TOKEN is set (len=${#NODE_AUTH_TOKEN})" || echo "[build_sample_app] NODE_AUTH_TOKEN unset"
# Use registry.npmjs.org explicitly (avoid registry.yarnpkg.com which can trigger token messages).
echo "[build_sample_app] Using registry: https://registry.npmjs.org/"
npm install --registry=https://registry.npmjs.org/

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "Build and setup completed successfully!"
else
    echo "Setup failed. Please check the error messages above."
fi
