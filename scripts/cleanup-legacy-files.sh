#!/bin/bash
#
# Cleanup Legacy Files Script
# Removes old OAuth architecture files that are no longer needed
# after migrating to the JWT/AuthKit pattern.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Cleaning up legacy OAuth files..."

# Old OAuth architecture files to remove
FILES_TO_REMOVE=(
  "src/server.ts"
  "src/api-key-handler.ts"
  "src/auth/authkit-handler.ts"
  "src/auth/props.ts"
  "src/auth/session-types.ts"
  ".npmrc"
  "src/shared/logging.ts"
  "src/shared/ai-gateway.ts"
  "src/tool-descriptions.ts"
  "src/tools/example-tool.ts"
  "src/tools/example.ts"
)

# Remove each file if it exists
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    rm -f "$file"
    echo "  Removed: $file"
  else
    echo "  Already gone: $file"
  fi
done

echo ""
echo "Cleanup complete!"
