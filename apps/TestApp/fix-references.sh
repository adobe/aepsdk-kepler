#!/bin/bash
# Fix package references for TestApp
# This script creates proper symlinks to all required packages for Metro bundler

echo "Fixing package references for TestApp..."

# Create @adobe directory if it doesn't exist
mkdir -p node_modules/@adobe

# Remove any existing symlinks
rm -f node_modules/@adobe/kepler-aepcore
rm -f node_modules/@adobe/kepler-aepmedia
rm -f node_modules/react
rm -f node_modules/react-native
rm -f node_modules/@amazon-devices

# Create proper symlinks to the Adobe packages
ln -sf ../../../../packages/core node_modules/@adobe/kepler-aepcore
ln -sf ../../../../packages/media node_modules/@adobe/kepler-aepmedia

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
    require.resolve('@adobe/kepler-aepcore');
    require.resolve('@adobe/kepler-aepmedia');
    require.resolve('react');
    require.resolve('react-native');
    require.resolve('@amazon-devices/react-native-kepler');
    console.log('✓ All packages resolved successfully');
  } catch (e) {
    console.error('✗ Package resolution failed:', e.message);
    process.exit(1);
  }
"

