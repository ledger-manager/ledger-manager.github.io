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
      ~^https?://localhost(?::\d+)?$ $http_origin;
      ~^https?://127\.0\.0\.1(?::\d+)?$ $http_origin;
      ~^https?://192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$ $http_origin;
      ~^https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$ $http_origin;
      ~^https?://172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(?::\d+)?$ $http_origin;
      default "";
      ~^(__CORS_REGEX__)$ $http_origin;
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

        # Public ngrok requires Secure+None; local IP keeps non-Secure for Fauxton on HTTP.
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
