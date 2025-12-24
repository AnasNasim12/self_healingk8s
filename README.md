# Tiny crash HTTP app

## Run locally

```bash
npm start
```

Server listens on `0.0.0.0:${PORT:-8080}`.

## Docker

Build:
```bash
docker build -t tiny-crash-app .
```

Run:
```bash
docker run -p 8080:8080 tiny-crash-app
```

Tag for Kubernetes:
```bash
docker tag tiny-crash-app tiny-crash-app:1.0
```

## Kubernetes

Create namespace and deploy:
```bash
kubectl create namespace apps
kubectl apply -f deployment.yaml
```

Check status:
```bash
kubectl get pods -n apps
kubectl logs -n apps -l app=tiny-crash-app
```

## Endpoints

- `GET /healthz` → `200 ok`
- `GET /crash` → returns `500` then exits the process with code `1`


SLO

The service must be available 99.9% of the time over a 1-hour window.

SLI

“No crashes = service is available”

