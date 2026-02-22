#!/bin/bash
# Post-build script to create .amplify-hosting directory structure

set -e

echo "Creating .amplify-hosting directory structure..."

# Clean up any previous build
rm -rf .amplify-hosting

# Create directory structure
mkdir -p .amplify-hosting/compute/default
mkdir -p .amplify-hosting/static/_next

# Copy the Next.js build output to compute
cp -r .next .amplify-hosting/compute/default/.next
cp -r node_modules .amplify-hosting/compute/default/node_modules
cp package.json .amplify-hosting/compute/default/package.json
cp amplify-server.js .amplify-hosting/compute/default/server.js

# Copy next.config.js if it exists
if [ -f next.config.js ]; then
  cp next.config.js .amplify-hosting/compute/default/next.config.js
fi

# Copy static assets from .next/static to .amplify-hosting/static/_next/static
if [ -d .next/static ]; then
  cp -r .next/static .amplify-hosting/static/_next/static
fi

# Copy public files to static root
if [ -d public ]; then
  cp -r public/* .amplify-hosting/static/ 2>/dev/null || true
fi

# Get Next.js version from node_modules
NEXT_VERSION=$(node -e "console.log(require('next/package.json').version)")

# Create deploy-manifest.json
cat > .amplify-hosting/deploy-manifest.json << EOF
{
  "version": 1,
  "routes": [
    {
      "path": "/_next/static/*",
      "target": {
        "kind": "Static",
        "cacheControl": "public, max-age=31536000, immutable"
      }
    },
    {
      "path": "/_next/image",
      "target": {
        "kind": "ImageOptimization",
        "cacheControl": "public, max-age=3600, immutable"
      }
    },
    {
      "path": "/*.*",
      "target": {
        "kind": "Static"
      },
      "fallback": {
        "kind": "Compute",
        "src": "default"
      }
    },
    {
      "path": "/*",
      "target": {
        "kind": "Compute",
        "src": "default"
      }
    }
  ],
  "computeResources": [
    {
      "name": "default",
      "entrypoint": "server.js",
      "runtime": "nodejs20.x"
    }
  ],
  "imageSettings": {
    "sizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    "domains": [],
    "remotePatterns": [
      {
        "protocol": "https",
        "hostname": "z-cdn-media.chatglm.cn"
      }
    ],
    "formats": ["image/webp"],
    "minumumCacheTTL": 60,
    "dangerouslyAllowSVG": false
  },
  "framework": {
    "name": "next",
    "version": "${NEXT_VERSION}"
  }
}
EOF

echo "✓ .amplify-hosting directory created successfully"
echo "✓ deploy-manifest.json generated"
ls -la .amplify-hosting/
