# Manifest split

These files contain the static Kubernetes resources used by `bootstrap.sh`.

- PVC, services, and deployment templates are stored here.
- ConfigMaps are rendered from the `*.yaml.tpl` files by `bootstrap.sh` so the same manifests can be reused with different CORS and image settings.
