#!/usr/bin/env bash
set -euo pipefail

NS="${1:-mcm-backend}"
CM_NAME="nginx-config"
TMP_YAML="/tmp/${CM_NAME}-lan.yaml"
BACKUP="/tmp/${CM_NAME}-backup-$(date +%Y%m%d-%H%M%S).yaml"

echo "Using namespace: ${NS}"
echo "Backing up current ConfigMap to: ${BACKUP}"
kubectl -n "${NS}" get configmap "${CM_NAME}" -o yaml > "${BACKUP}"

cat > "${TMP_YAML}" <<'YAML'
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  default.conf: |
    map $host $is_public_tunnel {
      default 0;
      ~*\.ngrok(-free)?\.(app|dev|io)$ 1;
    }

    map $is_public_tunnel $auth_cookie_path {
      default "/; SameSite=Lax";
      1 "/; Secure; SameSite=None";
    }

    map "$is_public_tunnel:$uri" $deny_public_admin {
      default 0;
      ~^1:/api/_utils(?:/|$) 1;
      ~^1:/api/_(all_dbs|dbs_info|membership|node|config|cluster_setup|active_tasks|scheduler|replicate|users|replicator|global_changes|fauxton)(?:/|$) 1;
      ~^1:/api/[^/]+/_ 1;
    }

    map $http_origin $cors_allowed_origin {
      default "";
      ~^https?://localhost(?::\d+)?$ $http_origin;
      ~^https?://127\.0\.0\.1(?::\d+)?$ $http_origin;
      ~^https?://192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$ $http_origin;
      ~^https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$ $http_origin;
      ~^https?://172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(?::\d+)?$ $http_origin;
      ~^https://ledger-manager\.github\.io$ $http_origin;
    }

    server {
      listen 80;
      server_name _;

      client_max_body_size 100M;
      proxy_buffers 8 16k;
      proxy_buffer_size 32k;

      add_header X-Content-Type-Options nosniff always;
      add_header X-Frame-Options SAMEORIGIN always;
      add_header X-XSS-Protection "1; mode=block" always;

      location /api/ {
        if ($deny_public_admin = 1) {
          return 403;
        }

        proxy_pass http://couchdb:5984/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_redirect off;

        proxy_cookie_path / "$auth_cookie_path";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;

        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Credentials;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Headers;

        add_header Access-Control-Allow-Origin "$cors_allowed_origin" always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,ngrok-skip-browser-warning" always;

        if ($request_method = 'OPTIONS') {
          add_header Access-Control-Allow-Origin "$cors_allowed_origin" always;
          add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
          add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,ngrok-skip-browser-warning" always;
          add_header Access-Control-Allow-Credentials "true" always;
          add_header Access-Control-Max-Age 3600 always;
          add_header Content-Length 0;
          add_header Content-Type text/plain;
          return 204;
        }
      }

      location = / {
        return 200 'MCM CouchDB proxy is running\n';
        add_header Content-Type text/plain;
      }
    }
YAML

echo "Applying updated ConfigMap..."
kubectl -n "${NS}" apply -f "${TMP_YAML}"

echo "Restarting nginx deployment..."
kubectl -n "${NS}" rollout restart deployment/nginx
kubectl -n "${NS}" rollout status deployment/nginx --timeout=180s

echo
echo "Done. Test CORS from your client machine:"
echo "curl.exe -i -X OPTIONS \"http://192.168.0.29:30080/api/_session\" -H \"Origin: http://192.168.0.50:4200\" -H \"Access-Control-Request-Method: POST\" -H \"Access-Control-Request-Headers: content-type,authorization\""
