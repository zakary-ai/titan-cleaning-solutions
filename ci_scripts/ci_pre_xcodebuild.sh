#!/bin/sh

set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "Node: $(node -v)"
echo "npm: $(npm -v)"

cd $CI_PRIMARY_REPOSITORY_PATH

echo "Ensuring Node dependencies are installed..."
npm install

echo "Syncing Capacitor iOS..."
npx cap sync ios

echo "Pre-xcodebuild setup complete."
