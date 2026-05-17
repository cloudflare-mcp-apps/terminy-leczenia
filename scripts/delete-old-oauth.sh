#!/bin/bash
#
# Delete old OAuth architecture files from skeleton
# These are replaced by the new JWT/AuthKit pattern
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Deleting old OAuth architecture files..."

FILES_TO_DELETE=(
  "src/server.ts"
  "src/api-key-handler.ts"
  "src/auth/authkit-handler.ts"
  "src/auth/props.ts"
  "src/auth/session-types.ts"
  ".npmrc"
)

for file in "${FILES_TO_DELETE[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "  Deleted: $file"
  else
    echo "  Already gone: $file"
  fi
done

echo "Done. Old OAuth files removed."
