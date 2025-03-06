#!/bin/bash

# Exit on any error
set -e

echo "Building and archiving AEP Kepler SDK packages..."

# Build and archive all packages
echo "Building and archiving packages..."
yarn archive_all

echo "Preparing SDK distribution package..."

# Create a temporary directory for packaging
TEMP_DIR="dist/AEPKeplerSDK"
rm -rf dist
mkdir -p $TEMP_DIR

# Create and populate libs directory at root level
echo "Setting up SDK packages..."
mkdir -p $TEMP_DIR/libs
cp out/@adobe-kepler-aepcore-*.tgz $TEMP_DIR/libs/
cp out/@adobe-kepler-aepmedia-*.tgz $TEMP_DIR/libs/

# Copy documentation
echo "Copying documentation..."
mkdir -p $TEMP_DIR/docs
cp -r documentation/* $TEMP_DIR/docs/
# Remove .DS_Store files if they exist
find $TEMP_DIR/docs -name ".DS_Store" -delete

# Create and populate sample app directory
echo "Setting up sample app..."
mkdir -p $TEMP_DIR/AEPSampleApp

# Copy all files from AEPSampleApp except generated files
rsync -av --progress apps/AEPSampleApp/ $TEMP_DIR/AEPSampleApp/ \
  --exclude 'node_modules' \
  --exclude 'build' \
  --exclude 'dist' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude 'yarn.lock' \
  --exclude 'package-lock.json' \
  --exclude 'ios/build' \
  --exclude 'ios/Pods' \
  --exclude 'android/build' \
  --exclude 'android/app/build' \
  --exclude 'android/.gradle'

# Create libs directory in AEPSampleApp and copy SDK packages
mkdir -p $TEMP_DIR/AEPSampleApp/libs
cp $TEMP_DIR/libs/@adobe-kepler-aepcore-*.tgz $TEMP_DIR/AEPSampleApp/libs/
cp $TEMP_DIR/libs/@adobe-kepler-aepmedia-*.tgz $TEMP_DIR/AEPSampleApp/libs/

# Ensure AEPSDKConfig.json has proper formatting
echo '{
  "edge.configId": "<YOUR_DATASTREAM_ID>"
}' > $TEMP_DIR/AEPSampleApp/src/AEPSDKConfig.json

# Copy main README to the SDK package
echo "Copying README..."
cp README.md $TEMP_DIR/

# Create a clean .gitignore
echo "Creating .gitignore..."
cat > $TEMP_DIR/.gitignore << EOL
.DS_Store
*.log
node_modules/
EOL

# Create a distribution archive
echo "Creating distribution archive..."
cd dist
tar -czf AEPKeplerSDK.tar.gz AEPKeplerSDK/

echo ""
echo "Distribution package created successfully!"
echo "Location: dist/AEPKeplerSDK.tar.gz"
echo ""
echo "Package contents:"
echo "- libs/: SDK library packages"
echo "- docs/: SDK documentation"
echo "- AEPSampleApp/: Sample application"
echo ""
