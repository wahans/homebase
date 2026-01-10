#!/bin/bash

echo "================================================"
echo "📱 HOMEBASE CHECKPOINT - Vectors App"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "vectors/package.json" ]; then
    echo "⚠️  Error: Run this from ~/Desktop/personal/riverside co/homebase"
    exit 1
fi

if [ -d ".git" ]; then
    echo "Git status:"
    git status --short
    echo ""

    # Commit if there are changes
    if [[ -n $(git status -s) ]]; then
        git add .
        git commit -m "WIP: Testing drag-and-drop reordering functionality

Current state:
- Drag-and-drop implementation added
- Testing in progress
- Pending: voice input, notifications, wife onboarding for Milestone 1"
        echo "✅ Changes committed"
    else
        echo "✅ No changes to commit"
    fi
else
    echo "⚠️  No git repository found - initializing one"
    git init
    git add .
    git commit -m "Initial commit: Vectors UI overhaul with drag-and-drop"
    echo "✅ Git repo initialized and committed"
fi

echo ""
echo "================================================"
echo "✅ HOMEBASE CHECKPOINT COMPLETE"
echo "================================================"
echo ""
echo "Safe to quit this terminal."
