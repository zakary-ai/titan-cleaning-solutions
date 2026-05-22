#!/bin/sh

set -e

export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Node.js is not installed by default in Xcode Cloud — install it via Homebrew
if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found — installing via Homebrew..."
    brew install node
fi

echo "Node: $(node -v)"
echo "npm: $(npm -v)"

cd $CI_PRIMARY_REPOSITORY_PATH

echo "Installing Node dependencies..."
npm install

echo "Post-clone setup complete."
