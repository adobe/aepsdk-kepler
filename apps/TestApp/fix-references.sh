#!/bin/bash
# Copyright 2026 Adobe. All rights reserved.
# This file is licensed to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License. You may obtain a copy
# of the License at http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software distributed under
# the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
# OF ANY KIND, either express or implied. See the License for the specific language
# governing permissions and limitations under the License.

# Fix package references for TestApp
# This script creates proper symlinks to all required packages for Metro bundler

echo "Fixing package references for TestApp..."

# Create @adobe directory if it doesn't exist
mkdir -p node_modules/@adobe

# Remove any existing symlinks
rm -f node_modules/@adobe/vega-aepcore
rm -f node_modules/@adobe/vega-aepmedia
rm -f node_modules/react
rm -f node_modules/react-native
rm -f node_modules/@amazon-devices

# Create proper symlinks to the Adobe packages
ln -sf ../../../../packages/core node_modules/@adobe/vega-aepcore
ln -sf ../../../../packages/media node_modules/@adobe/vega-aepmedia

# Create symlinks for React and React Native (needed by Metro bundler)
ln -sf ../../../node_modules/react node_modules/react
ln -sf ../../../node_modules/react-native node_modules/react-native

# Create symlink for Amazon Devices packages
ln -sf ../../../node_modules/@amazon-devices node_modules/@amazon-devices

echo "✓ All symlinks created successfully"
echo ""
echo "Verifying package resolution..."
node -e "
  try {
    require.resolve('@adobe/vega-aepcore');
    require.resolve('@adobe/vega-aepmedia');
    require.resolve('react');
    require.resolve('react-native');
    require.resolve('@amazon-devices/react-native-kepler');
    console.log('✓ All packages resolved successfully');
  } catch (e) {
    console.error('✗ Package resolution failed:', e.message);
    process.exit(1);
  }
"

