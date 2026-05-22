#!/bin/sh

set -e

cd $CI_PRIMARY_REPOSITORY_PATH

echo "Installing Node dependencies..."

node -v || true
npm -v || true

npm install

echo "Installing required Capacitor plugins..."

npm install @capacitor/app @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications --save

echo "Building web app..."

npm run build

echo "Syncing Capacitor iOS..."

npx cap sync ios

echo "Post-clone setup complete."
