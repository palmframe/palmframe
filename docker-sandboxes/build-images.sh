#!/bin/bash

# Palmframe Docker Sandbox Images Build Script
# This script builds all Docker images needed for the sandbox runtime

set -e

echo "Building Palmframe Docker sandbox images..."
echo ""

# Build Python interpreter image
echo "📦 Building python-interpreter..."
docker build -t palmframe/python-interpreter:latest ./python-interpreter
echo "✅ python-interpreter built successfully"
echo ""

# Build Next.js developer image
echo "📦 Building nextjs-developer..."
docker build -t palmframe/nextjs-developer:latest ./nextjs-developer
echo "✅ nextjs-developer built successfully"
echo ""

# Build Vue developer image
echo "📦 Building vue-developer..."
docker build -t palmframe/vue-developer:latest ./vue-developer
echo "✅ vue-developer built successfully"
echo ""

# Build Streamlit developer image
echo "📦 Building streamlit-developer..."
docker build -t palmframe/streamlit-developer:latest ./streamlit-developer
echo "✅ streamlit-developer built successfully"
echo ""

# Build Gradio developer image
echo "📦 Building gradio-developer..."
docker build -t palmframe/gradio-developer:latest ./gradio-developer
echo "✅ gradio-developer built successfully"
echo ""

echo "🎉 All Docker images built successfully!"
echo ""
echo "You can now start Palmframe with Docker sandbox support."
echo "To verify, run: docker images | grep palmframe"
