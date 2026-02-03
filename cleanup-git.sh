#!/bin/bash

echo "🧹 Cleaning up Git repository..."

# Remove node_modules from git tracking
echo "Removing node_modules from git..."
git rm -r --cached honey-pot/node_modules 2>/dev/null
git rm -r --cached analyzer-service/node_modules 2>/dev/null
git rm -r --cached Dashboard/node_modules 2>/dev/null
git rm -r --cached attack-simulator/node_modules 2>/dev/null

# Remove package-lock files
echo "Removing package-lock.json files..."
git rm --cached honey-pot/package-lock.json 2>/dev/null
git rm --cached analyzer-service/package-lock.json 2>/dev/null
git rm --cached Dashboard/package-lock.json 2>/dev/null
git rm --cached package-lock.json 2>/dev/null

# Remove log files
echo "Removing log files..."
git rm --cached honey-pot/logs/honeypot.log.json 2>/dev/null
git rm --cached analyzer-service/reports/attack-report.json 2>/dev/null

# Remove .env files
echo "Removing .env files..."
git rm --cached Dashboard/.env.local 2>/dev/null

# Add .gitignore
echo "Adding .gitignore..."
git add .gitignore

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review changes: git status"
echo "2. Commit: git commit -m 'chore: add .gitignore and remove tracked files'"
echo "3. Push: git push origin main"
