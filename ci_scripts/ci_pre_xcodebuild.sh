#!/bin/sh

set -e

cd $CI_PRIMARY_REPOSITORY_PATH

echo "Installing Node dependencies..."
npm install

echo "Syncing Capacitor iOS..."
npx cap sync ios

echo "Pre-xcodebuild setup complete."
