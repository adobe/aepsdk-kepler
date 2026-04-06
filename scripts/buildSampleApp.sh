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

echo "Building SDK packages and installing AEPSampleApp dependencies from local source..."

# Build all packages first so dist/ exists for the file: references
echo "Building SDK packages (core + media)..."
yarn build_all

# Clean generated folders in the sample app
echo "Cleaning AEPSampleApp generated folders..."
rm -rf apps/AEPSampleApp/node_modules
rm -rf apps/AEPSampleApp/package-lock.json
rm -rf apps/AEPSampleApp/.vscode
rm -rf apps/AEPSampleApp/yarn.lock
rm -rf apps/AEPSampleApp/ios/build
rm -rf apps/AEPSampleApp/ios/Pods
rm -rf apps/AEPSampleApp/android/build
rm -rf apps/AEPSampleApp/android/app/build
rm -rf apps/AEPSampleApp/android/.gradle

# Navigate to sample app directory
cd apps/AEPSampleApp

echo "[build_sample_app] Installing sample app dependencies in $(pwd)..."
# @adobe/vega-aepcore and @adobe/vega-aepmedia are installed from local packages/core
# and packages/media via file: references. npm packs them on the fly from source.
npm install --registry=https://registry.npmjs.org/

if [ $? -eq 0 ]; then
    echo "Build and setup completed successfully!"
else
    echo "Setup failed. Please check the error messages above."
    exit 1
fi
