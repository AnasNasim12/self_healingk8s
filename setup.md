This documents everything needed to reproduce the project from zero, in a way that:
an interviewer can follow
you can rerun months later
looks professional and SRE-grade
No fluff. No missing steps.
Auto-Healing Kubernetes Cluster (SRE Project)
This project demonstrates a self-healing Kubernetes application with Prometheus-based observability, alerting, and Grafana dashboards, validating crash detection and recovery with measurable MTTR improvement.
🧱 Architecture Overview
Flow:
Crash → Kubernetes restarts pod → Prometheus detects restart →
Alert fires → Grafana visualizes incident → Service recovers
Core components:
Kubernetes (Minikube)
Docker
Prometheus (kube-prometheus-stack)
Alertmanager
Grafana
Node.js demo app (intentional crash endpoint)
✅ Prerequisites
Install the following on your machine:
Docker
kubectl
Minikube
Helm
Node.js (for local testing only)
Verify:
docker --version
kubectl version --client
minikube version
helm version
🚀 Step 1: Start Kubernetes (Minikube)
minikube start
kubectl get nodes
Ensure the node is Ready.
🧪 Step 2: Application Code
The app:
exposes /healthz
exposes /crash which exits the process intentionally
Key behavior
/healthz → returns ok
/crash → crashes the container
🐳 Step 3: Build the Docker Image (IMPORTANT for Minikube)
Point Docker to Minikube’s daemon:
eval $(minikube docker-env)
Build the image:
docker build -t tiny-crash-app:1.0 ./app
Verify:
docker images | grep tiny-crash-app
☸️ Step 4: Deploy the Application to Kubernetes
4.1 Create namespace
kubectl create namespace apps
4.2 Apply manifests
kubectl apply -f k8s/
This includes:
Deployment (with liveness & readiness probes)
Service (ClusterIP)
Verify:
kubectl get pods -n apps
kubectl get svc -n apps
Expected:
Pod Running
Service tiny-crash-app exists
🌐 Step 5: Access the Application
Port-forward the Service:
kubectl port-forward -n apps svc/tiny-crash-app 8080:8080
Test:
curl http://localhost:8080/healthz
Expected:
ok
💥 Step 6: Trigger a Crash (Self-Healing Test)
curl http://localhost:8080/crash
Expected behavior:
connection drops
pod terminates
Kubernetes creates a new pod automatically
Verify restart:
kubectl get pods -n apps
RESTARTS should increment.
📊 Step 7: Install Monitoring Stack (Prometheus + Alertmanager + Grafana)
7.1 Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
7.2 Create monitoring namespace
kubectl create namespace monitoring
7.3 Install kube-prometheus-stack
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring
Wait for pods:
kubectl get pods -n monitoring
🔍 Step 8: Access Prometheus
Port-forward Prometheus:
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
Open:
http://localhost:9090
Verify Kubernetes metrics
Run in Graph:
kube_pod_container_status_restarts_total
If this returns data → Prometheus is working.
🚨 Step 9: Apply Alert Rules
Apply the PrometheusRule:
kubectl apply -f monitoring/prometheus-rule-crash.yaml
Verify:
Prometheus → Status → Rules
Alert TinyCrashAppPodRestarts exists and is inactive
📣 Step 10: Access Alertmanager
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-alertmanager 9093:9093
Open:
http://localhost:9093
Trigger a crash again and observe:
alert transitions to FIRING
📈 Step 11: Access Grafana
11.1 Port-forward Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
Open:
http://localhost:3000
11.2 Login
kubectl get secret -n monitoring monitoring-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode
Username: admin
Password: (output above)
📊 Step 12: Grafana Queries Used
Restart detection (core signal)
increase(
  kube_pod_container_status_restarts_total{namespace="apps", pod=~"tiny-crash-app.*"}[5m]
)
Alert status panel
ALERTS{alertname="TinyCrashAppPodRestarts"}
Availability SLI
1 - clamp_max(
  increase(
    kube_pod_container_status_restarts_total{namespace="apps", pod=~"tiny-crash-app.*"}[5m]
  ),
  1
)
🔁 Step 13: Safe Reset (Without Losing Dashboards)
To re-test the system without uninstalling monitoring:
kubectl delete namespace apps
kubectl create namespace apps
kubectl apply -f k8s/
Then repeat crash testing.
✅ Success Criteria
This project is working correctly if:
Kubernetes restarts the app automatically
Prometheus detects restarts
Alert fires in Alertmanager
Grafana reflects alert state
Service recovers without manual intervention
📌 What This Demonstrates
Kubernetes self-healing
Prometheus observability
Alert-driven reliability detection
Grafana alert visualization
Practical SRE workflows
MTTR improvement via automation