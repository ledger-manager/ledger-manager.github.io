#!/usr/bin/env bash
set -euo pipefail

command -v kubectl >/dev/null 2>&1 || {
  echo "kubectl is required" >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="${NAMESPACE:-mcm-backend}"
OUTPUT_FILE="${OUTPUT_FILE:-src/environments/environment.prod.ts}"
TEMPLATE_FILE="${TEMPLATE_FILE:-$SCRIPT_DIR/frontend-environment.prod.template.ts}"

if [[ $# -gt 0 ]]; then
  BASE_URL="${1%/}"
else
  BASE_URL="$($SCRIPT_DIR/get-public-url.sh)"
fi

if [[ -z "$BASE_URL" ]]; then
  echo "BASE_URL is required" >&2
  exit 1
fi

sed "s|__BASE_URL__|${BASE_URL}/api|g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Updated ${OUTPUT_FILE} with BASE_URL=${BASE_URL}/api"
