#!/bin/bash

# Exit on any error
set -e

echo "Building and archiving AEP Kepler SDK packages..."

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
echo "Copying SDK packages to sample app..."
cp out/@adobe-kepler-aepcore-*.tgz apps/AEPSampleApp/libs/
cp out/@adobe-kepler-aepmedia-*.tgz apps/AEPSampleApp/libs/

# Navigate to sample app directory
cd apps/AEPSampleApp

echo "Installing sample app dependencies..."
# Always use npm for AEPSampleApp
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "Build and setup completed successfully!"
else
    echo "Setup failed. Please check the error messages above."
fi
