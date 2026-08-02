#!/usr/bin/env bash
set -euo pipefail

command -v kubectl >/dev/null 2>&1 || {
  echo "kubectl is required" >&2
  exit 1
}

NAMESPACE="${NAMESPACE:-mcm-backend}"

for _ in $(seq 1 30); do
  public_url="$(kubectl -n "$NAMESPACE" logs deployment/ngrok --tail=200 2>/dev/null | grep -oE 'https://[^[:space:]]+' | head -n1 || true)"
  if [[ -n "$public_url" ]]; then
    echo "$public_url"
    exit 0
  fi
  sleep 2
done

echo "Unable to determine ngrok public URL" >&2
exit 1