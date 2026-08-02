apiVersion: v1
kind: ConfigMap
metadata:
  name: couchdb-config
data:
  local.ini: |
    [couchdb]
    single_node = true

    [chttpd]
    bind_address = 0.0.0.0
    port = 5984

    [httpd]
    bind_address = 0.0.0.0
    port = 5984

    [cors]
    origins = __CORS_ALLOWED_ORIGINS__
    credentials = true
    headers = accept, authorization, content-type, origin, referer, x-requested-with, ngrok-skip-browser-warning
    methods = GET, PUT, POST, HEAD, DELETE, OPTIONS
    max_age = 3600

    [log]
    level = info
