# CouchDB and ngrok backend deploy

This repo keeps the GitHub Pages deploy workflow untouched. The backend stack for CouchDB, Nginx, and ngrok lives in a separate script and workflow path.

## What it deploys

- CouchDB in a Kubernetes namespace on minikube
- Nginx as a reverse proxy so the app can keep using `/api`
- ngrok to expose the Nginx endpoint to the public internet

## Files

- [scripts/couchdb-ngrok/bootstrap.sh](../scripts/couchdb-ngrok/bootstrap.sh)
- [scripts/couchdb-ngrok/init-databases.sh](../scripts/couchdb-ngrok/init-databases.sh)
- [scripts/couchdb-ngrok/get-public-url.sh](../scripts/couchdb-ngrok/get-public-url.sh)
- [scripts/couchdb-ngrok/update-frontend-env.sh](../scripts/couchdb-ngrok/update-frontend-env.sh)
- [scripts/couchdb-ngrok/.env.example](../scripts/couchdb-ngrok/.env.example)
- [scripts/couchdb-ngrok/manifests/](../scripts/couchdb-ngrok/manifests)
- [.github/workflows/couchdb-ngrok.yml](../.github/workflows/couchdb-ngrok.yml)

## Required secrets

- `COUCHDB_ADMIN_USER`
- `COUCHDB_ADMIN_PASSWORD`
- `NGROK_AUTHTOKEN`

## Optional variables

- `CORS_ALLOWED_ORIGINS` defaults to `http://localhost:4200,https://ledger-manager.github.io`
- `DATABASES` defaults to `mcm_dev,mcm_prod,wsm_dev,wsm_prod`
- `MCM_DATABASES` is still supported as a legacy fallback
- `NAMESPACE` defaults to `mcm-backend`
- `NGROK_DOMAIN` optional static/reserved ngrok domain (for example `my-app.ngrok-free.dev`)
- `NGROK_DOMAIN_ID` optional ngrok reserved domain id for reference

## Local run

```bash
export COUCHDB_ADMIN_PASSWORD='your-password'
export NGROK_AUTHTOKEN='your-ngrok-token'
cp scripts/couchdb-ngrok/.env.example scripts/couchdb-ngrok/.env.local
chmod +x scripts/couchdb-ngrok/*.sh
scripts/couchdb-ngrok/bootstrap.sh
```

## Fresh database initialization only

Use this when CouchDB is already running and you only want to create or verify app databases.

```bash
export COUCHDB_URL='http://192.168.0.29:30080/api'
export COUCHDB_ADMIN_USER='admin'
export COUCHDB_ADMIN_PASSWORD='your-password'
export DATABASES='mcm_dev,mcm_prod,wsm_dev,wsm_prod'
scripts/couchdb-ngrok/init-databases.sh
```

## Frontend sync

When ngrok changes, update the Angular production API URL with:

```bash
scripts/couchdb-ngrok/update-frontend-env.sh https://<your-ngrok-domain>
```

That rewrites `src/environments/environment.prod.ts` so the Pages build points at the current backend URL.

## Workflow run

The workflow is designed for a self-hosted runner that can reach minikube and kubectl.

## App URL

Once ngrok is up, the Angular app should point at:

```text
https://<your-ngrok-domain>/api
```
