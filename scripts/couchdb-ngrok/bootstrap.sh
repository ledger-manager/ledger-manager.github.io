#!/usr/bin/env bash
set -euo pipefail

command -v kubectl >/dev/null 2>&1 || {
  echo "kubectl is required" >&2
  exit 1
}

NAMESPACE="${NAMESPACE:-mcm-backend}"
COUCHDB_ADMIN_USER="${COUCHDB_ADMIN_USER:-admin}"
COUCHDB_ADMIN_PASSWORD="${COUCHDB_ADMIN_PASSWORD:-}"
NGROK_AUTHTOKEN="${NGROK_AUTHTOKEN:-}"
NGROK_DOMAIN="${NGROK_DOMAIN:-}"
NGROK_DOMAIN_ID="${NGROK_DOMAIN_ID:-}"
COUCHDB_IMAGE="${COUCHDB_IMAGE:-couchdb:3.4.2}"
NGINX_IMAGE="${NGINX_IMAGE:-nginx:1.27-alpine}"
NGROK_IMAGE="${NGROK_IMAGE:-ngrok/ngrok:latest}"
CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://localhost:4200,https://ledger-manager.github.io}"
DATABASES="${DATABASES:-${MCM_DATABASES:-mcm_dev,mcm_prod,wsm_dev,wsm_prod}}"
DEPLOY_NGROK="${DEPLOY_NGROK:-true}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_DIR="$SCRIPT_DIR/manifests"
RENDER_DIR="$(mktemp -d)"

if [[ -z "$COUCHDB_ADMIN_PASSWORD" ]]; then
  echo "COUCHDB_ADMIN_PASSWORD is required" >&2
  exit 1
fi

if [[ "$DEPLOY_NGROK" == "true" && -z "$NGROK_AUTHTOKEN" ]]; then
  echo "NGROK_AUTHTOKEN is required when DEPLOY_NGROK=true" >&2
  exit 1
fi

cors_regex=""
if command -v python3 >/dev/null 2>&1; then
  cors_regex="$(python3 - <<'PY'
import re
import os

origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
escaped = [re.escape(origin.strip()) for origin in origins.split(',') if origin.strip()]
print('|'.join(escaped))
PY
)"
fi

if [[ -z "$cors_regex" ]]; then
  cors_regex="$(printf '%s' "$CORS_ALLOWED_ORIGINS" | tr ',' '|' | tr -d '[:space:]')"
fi

cleanup() {
  rm -rf "$RENDER_DIR"
}
trap cleanup EXIT

kubectl get namespace "$NAMESPACE" >/dev/null 2>&1 || kubectl create namespace "$NAMESPACE"

kubectl -n "$NAMESPACE" create secret generic couchdb-admin \
  --from-literal=COUCHDB_USER="$COUCHDB_ADMIN_USER" \
  --from-literal=COUCHDB_PASSWORD="$COUCHDB_ADMIN_PASSWORD" \
  --from-literal=COUCHDB_SECRET="${COUCHDB_SECRET:-mcm-couchdb-secret}" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n "$NAMESPACE" create secret generic ngrok-secret \
  --from-literal=NGROK_AUTHTOKEN="$NGROK_AUTHTOKEN" \
  --from-literal=NGROK_DOMAIN="$NGROK_DOMAIN" \
  --from-literal=NGROK_DOMAIN_ID="$NGROK_DOMAIN_ID" \
  --dry-run=client -o yaml | kubectl apply -f -

sed \
  -e "s#__CORS_ALLOWED_ORIGINS__#${CORS_ALLOWED_ORIGINS}#g" \
  -e "s#__CORS_REGEX__#${cors_regex}#g" \
  "$MANIFEST_DIR/couchdb-configmap.yaml.tpl" > "$RENDER_DIR/couchdb-configmap.yaml"

sed \
  -e "s#__CORS_ALLOWED_ORIGINS__#${CORS_ALLOWED_ORIGINS}#g" \
  -e "s#__CORS_REGEX__#${cors_regex}#g" \
  "$MANIFEST_DIR/nginx-configmap.yaml.tpl" > "$RENDER_DIR/nginx-configmap.yaml"

sed \
  -e "s#__COUCHDB_IMAGE__#${COUCHDB_IMAGE}#g" \
  -e "s#__NGINX_IMAGE__#${NGINX_IMAGE}#g" \
  -e "s#__NGROK_IMAGE__#${NGROK_IMAGE}#g" \
  "$MANIFEST_DIR/couchdb-deployment.yaml.tpl" > "$RENDER_DIR/couchdb-deployment.yaml"

sed -e "s#__NGINX_IMAGE__#${NGINX_IMAGE}#g" \
  "$MANIFEST_DIR/nginx-deployment.yaml.tpl" > "$RENDER_DIR/nginx-deployment.yaml"

if [[ "$DEPLOY_NGROK" == "true" ]]; then
  sed -e "s#__NGROK_IMAGE__#${NGROK_IMAGE}#g" \
    -e "s#__NGROK_DOMAIN__#${NGROK_DOMAIN}#g" \
    "$MANIFEST_DIR/ngrok-deployment.yaml.tpl" > "$RENDER_DIR/ngrok-deployment.yaml"
fi

kubectl apply -n "$NAMESPACE" -f "$MANIFEST_DIR/pvc.yaml"
kubectl apply -n "$NAMESPACE" -f "$RENDER_DIR/couchdb-configmap.yaml"
kubectl apply -n "$NAMESPACE" -f "$RENDER_DIR/nginx-configmap.yaml"
kubectl apply -n "$NAMESPACE" -f "$RENDER_DIR/couchdb-deployment.yaml"
kubectl apply -n "$NAMESPACE" -f "$MANIFEST_DIR/couchdb-service.yaml"
kubectl apply -n "$NAMESPACE" -f "$RENDER_DIR/nginx-deployment.yaml"
kubectl apply -n "$NAMESPACE" -f "$MANIFEST_DIR/nginx-service.yaml"
if [[ "$DEPLOY_NGROK" == "true" ]]; then
  kubectl apply -n "$NAMESPACE" -f "$RENDER_DIR/ngrok-deployment.yaml"
fi

kubectl -n "$NAMESPACE" rollout status deployment/couchdb --timeout=10m
kubectl -n "$NAMESPACE" rollout status deployment/nginx --timeout=10m
if [[ "$DEPLOY_NGROK" == "true" ]]; then
  kubectl -n "$NAMESPACE" rollout status deployment/ngrok --timeout=10m
fi

port_forward_log="$(mktemp)"
kubectl -n "$NAMESPACE" port-forward svc/couchdb 15984:5984 >"$port_forward_log" 2>&1 &
port_forward_pid=$!
cleanup() {
  kill "$port_forward_pid" >/dev/null 2>&1 || true
  rm -f "$port_forward_log"
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -sf http://127.0.0.1:15984/ >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

COUCHDB_URL="http://127.0.0.1:15984" \
COUCHDB_ADMIN_USER="$COUCHDB_ADMIN_USER" \
COUCHDB_ADMIN_PASSWORD="$COUCHDB_ADMIN_PASSWORD" \
DATABASES="$DATABASES" \
"$SCRIPT_DIR/init-databases.sh"

echo "Backend stack deployed in namespace: ${NAMESPACE}"
echo "Created/verified databases: ${DATABASES}"
if [[ "$DEPLOY_NGROK" == "true" ]]; then
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  public_url="$($script_dir/get-public-url.sh)"
  echo "Public URL: ${public_url}"
else
  echo "Public URL: not deployed yet (DEPLOY_NGROK=false)"
fi