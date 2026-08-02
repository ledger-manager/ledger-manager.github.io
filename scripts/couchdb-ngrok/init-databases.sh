#!/usr/bin/env bash
set -euo pipefail

COUCHDB_URL="${COUCHDB_URL:-http://127.0.0.1:5984}"
COUCHDB_ADMIN_USER="${COUCHDB_ADMIN_USER:-admin}"
COUCHDB_ADMIN_PASSWORD="${COUCHDB_ADMIN_PASSWORD:-}"
DATABASES="${DATABASES:-${MCM_DATABASES:-mcm_dev,mcm_prod,wsm_dev,wsm_prod}}"

if [[ -z "$COUCHDB_ADMIN_PASSWORD" ]]; then
  echo "COUCHDB_ADMIN_PASSWORD is required" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

created=()
existing=()

for db_name in ${DATABASES//,/ }; do
  db_name="$(echo "$db_name" | xargs)"
  if [[ -z "$db_name" ]]; then
    continue
  fi

  status_code="$(curl -s -o /dev/null -w '%{http_code}' \
    -u "${COUCHDB_ADMIN_USER}:${COUCHDB_ADMIN_PASSWORD}" \
    -X PUT "${COUCHDB_URL%/}/${db_name}")"

  case "$status_code" in
    201)
      created+=("$db_name")
      ;;
    412)
      existing+=("$db_name")
      ;;
    *)
      echo "Failed to create/verify database '$db_name' (HTTP $status_code)" >&2
      exit 1
      ;;
  esac
done

if [[ ${#created[@]} -gt 0 ]]; then
  echo "Created databases: ${created[*]}"
fi

if [[ ${#existing[@]} -gt 0 ]]; then
  echo "Already existed: ${existing[*]}"
fi

echo "Database initialization complete for: ${DATABASES}"