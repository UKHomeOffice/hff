# HFF App Helm Chart

A comprehensive Helm chart for deploying the HFF (Home Office Form Framework) application on Kubernetes, including support for Redis caching, Nginx proxy, networking policies, and certificate management.

## Overview

This Helm chart packages the HFF application with all its components:
- **Application Deployment**: Main HFF app with Nginx proxy sidecar
- **Redis Cache**: Session and data caching
- **Services**: ClusterIP services for app and Redis
- **Ingress**: External and internal ingress with TLS support
- **Network Policies**: Security controls for pod-to-pod communication
- **Certificates**: Automatic certificate management with cert-manager
- **ConfigMaps**: Application configuration management

## Chart Structure

```
helm-app/
├── Chart.yaml                      # Chart metadata
├── values.yaml                     # Default values
├── values-prod.yaml               # Production environment overrides
├── values-uat.yaml                # UAT environment overrides
├── values-dev.yaml                # Development environment overrides
├── README.md                       # This file
└── templates/
    ├── _helpers.tpl               # Template helpers and variables
    ├── app-deployment.yaml        # Application deployment
    ├── app-service.yaml           # Application service
    ├── app-configmap.yaml         # Application configuration
    ├── app-ingress-external.yaml  # External ingress
    ├── app-ingress-internal.yaml  # Internal ingress
    ├── app-networkpolicy-external.yaml
    ├── app-networkpolicy-internal.yaml
    ├── redis-deployment.yaml      # Redis deployment
    ├── redis-service.yaml         # Redis service
    ├── redis-configmap.yaml       # Redis configuration
    ├── redis-networkpolicy.yaml   # Redis network policy
    ├── certificate-external.yaml  # External TLS certificate
    └── certificate-internal.yaml  # Internal TLS certificate
```

## Prerequisites

1. **Kubernetes Cluster**: 1.19+
2. **Helm**: 3.0+
3. **cert-manager** (optional): For automatic certificate management
   ```bash
   helm repo add jetstack https://charts.jetstack.io
   helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace
   ```

## Installation

### Basic Installation (Development)

```bash
helm install hff-app ./helm-app \
  -n hff-dev \
  --create-namespace \
  -f helm-app/values-dev.yaml
```

### Production Installation

```bash
helm install hff-app ./helm-app \
  -n hff-prod \
  --create-namespace \
  -f helm-app/values-prod.yaml
```

### UAT Installation

```bash
helm install hff-app ./helm-app \
  -n hff-uat \
  --create-namespace \
  -f helm-app/values-uat.yaml
```

### Branch Deployment (CI/CD Integration)

```bash
helm install hff-app-branch ./helm-app \
  -n hff-dev \
  -f helm-app/values-dev.yaml \
  --set branch.enabled=true \
  --set branch.name=feature-xyz \
  --set image.tag=sha-abc123def
```

## Configuration

### Key Parameters

#### Global Settings
```yaml
global:
  namespace: hff-dev              # Kubernetes namespace
  environment: dev                # Environment type: prod, uat, dev, branch
```

#### Application
```yaml
app:
  name: hff-cc                    # Application name
  replicas: 1                     # Number of replicas (auto-set to 2 for prod)

image:
  repository: quay.io/ukhomeofficedigital/hff-cc
  tag: latest                     # Use commit SHA in CI/CD
  pullPolicy: Always
```

#### Ingress Configuration
```yaml
ingress:
  externalEnabled: true           # Enable external ingress
  internalEnabled: true           # Enable internal ingress
  external:
    hosts:
      prod: "hff-cc.homeoffice.gov.uk"
      uat: "hff-cc.uat.sas-notprod.homeoffice.gov.uk"
      dev: "hff-cc.sas-notprod.homeoffice.gov.uk"
  internal:
    hosts:
      uat: "hff-cc.internal.uat.sas-notprod.homeoffice.gov.uk"
```

#### Redis Configuration
```yaml
redis:
  enabled: true
  port: 6379
  replicas: 1
  resources:
    requests:
      cpu: "20m"
      memory: "100Mi"
    limits:
      cpu: "100m"
      memory: "200Mi"
```

#### Environment Variables
```yaml
env:
  TZ: Europe/London
  NODE_TLS_REJECT_UNAUTHORIZED: "0"
  REDIS_PORT: "6379"
  USE_MOCKS: "false"
```

#### Secrets
The chart expects these secrets to exist in your namespace:
```yaml
secrets:
  sessionSecret:
    name: session-secret
    key: session-secret
  notifyKey:
    name: notify-key
    key: notify-key
  queryKey:
    name: query-key
    key: query-key
```

Create secrets with:
```bash
kubectl create secret generic session-secret \
  --from-literal=session-secret=your-secret-value \
  -n hff-dev

kubectl create secret generic notify-key \
  --from-literal=notify-key=your-notify-key \
  -n hff-dev

kubectl create secret generic query-key \
  --from-literal=query-key=your-query-key \
  -n hff-dev
```

## Upgrading

Update an existing release:

```bash
helm upgrade hff-app ./helm-app \
  -n hff-prod \
  -f helm-app/values-prod.yaml \
  --set image.tag=v1.2.3
```

## Customization

### Custom ConfigMap Values

Add application-specific configuration in `values.yaml`:

```yaml
configMap:
  data:
    APP_SETTING_1: "value1"
    APP_SETTING_2: "value2"
    REDIS_CLUSTER: "redis-cluster.hff-prod.svc.cluster.local"
```

### Custom Ingress Annotations

```yaml
ingress:
  external:
    annotations:
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/rate-limit: "100"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
```

### Custom Resource Limits

```yaml
resources:
  app:
    requests:
      cpu: "50m"
      memory: "256Mi"
    limits:
      cpu: "500m"
      memory: "512Mi"
  nginx:
    requests:
      cpu: "20m"
      memory: "64Mi"
    limits:
      cpu: "200m"
      memory: "256Mi"
```

## Environment-Specific Deployments

### Multiple Environments

Deploy to multiple environments with different values:

```bash
# Development
helm install hff-app-dev ./helm-app -n hff-dev -f helm-app/values-dev.yaml

# UAT
helm install hff-app-uat ./helm-app -n hff-uat -f helm-app/values-uat.yaml

# Production
helm install hff-app-prod ./helm-app -n hff-prod -f helm-app/values-prod.yaml
```

### Branch Deployments (Feature Testing)

Deploy temporary feature branches to isolated namespaces:

```bash
# Deploy feature branch
helm install hff-app-feature-xyz ./helm-app \
  -n hff-dev \
  -f helm-app/values-dev.yaml \
  --set branch.enabled=true \
  --set branch.name=feature-xyz \
  --set branch.sourceUrl=feature-xyz \
  --set image.tag=abc123def567

# Access feature branch
# External: hff-cc-feature-xyz.branch.sas-notprod.homeoffice.gov.uk
# Internal: hff-cc-feature-xyz.internal.branch.sas-notprod.homeoffice.gov.uk

# Clean up feature branch
helm uninstall hff-app-feature-xyz -n hff-dev
```

## Health Checks

Health checks are automatically disabled for branch deployments but enabled for production and UAT:

```yaml
healthChecks:
  enabled: true
  liveness:
    path: /healthz/ping
    initialDelaySeconds: 10
    periodSeconds: 10
  readiness:
    path: /healthz/readiness
    initialDelaySeconds: 15
    periodSeconds: 5
```

## Security

### Network Policies
Network policies restrict traffic to and from the application:
- External ingress from the `ingress-external` namespace
- Internal ingress from the `ingress-internal` namespace  
- Redis access only from the application pod

Enable/disable with:
```yaml
networkPolicies:
  enabled: true
  externalIngress: true
  internalIngress: true
  redisAccess: true
```

### Security Context
All containers run as non-root:
```yaml
securityContext:
  runAsNonRoot: true
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Deploy with Helm
  run: |
    helm install hff-app ./helm-app \
      -n hff-${{ github.ref_name }} \
      -f helm-app/values-${{ github.ref_name }}.yaml \
      --set image.tag=${{ github.sha }} \
      --set image.repository=${{ secrets.REGISTRY }}/hff-cc
```

### GitLab CI Example

```yaml
deploy:
  script:
    - helm upgrade --install hff-app ./helm-app
        -n hff-$CI_COMMIT_BRANCH
        -f helm-app/values-$CI_COMMIT_BRANCH.yaml
        --set image.tag=$CI_COMMIT_SHA
```

## Troubleshooting

### Check Chart Validation
```bash
helm lint ./helm-app
```

### Dry Run
```bash
helm install hff-app ./helm-app -n hff-dev -f values-dev.yaml --dry-run --debug
```

### View Generated Templates
```bash
helm template hff-app ./helm-app -n hff-dev -f values-dev.yaml
```

### Check Release Status
```bash
helm status hff-app -n hff-dev
helm history hff-app -n hff-dev
helm get values hff-app -n hff-dev
```

### Debugging
```bash
# Get all resources
kubectl get all -n hff-dev

# Check pod logs
kubectl logs -n hff-dev -l app.kubernetes.io/name=hff-app

# Describe pod for events
kubectl describe pod -n hff-dev -l app.kubernetes.io/name=hff-app

# Check configmap
kubectl get configmap -n hff-dev

# Check ingress
kubectl get ingress -n hff-dev
```

## Migration from Original Kube Manifests

The original YAML files in `kube/` used custom templating syntax (`.KUBE_NAMESPACE`, `.APP_NAME`, etc.). This Helm chart replaces that with standard Helm values and templates.

### Key Changes:
1. **Templating**: Custom `{{ }}` syntax → Standard Helm templating
2. **Configuration**: Environment variables → `values.yaml` and environment-specific overrides
3. **Flexibility**: Single values file → Multiple environment-specific files
4. **API Versions**: `extensions/v1beta1` → `networking.k8s.io/v1` (updated for Kubernetes 1.19+)

### Migration Checklist:
- [ ] Create secrets in target namespace
- [ ] Customize `values-{environment}.yaml` for your deployment
- [ ] Update image repository and tag references
- [ ] Configure ingress hostnames and TLS certificates
- [ ] Set up cert-manager (if using automatic certificates)
- [ ] Deploy and test with dry-run first
- [ ] Verify health checks and connectivity
- [ ] Update CI/CD pipelines

## Uninstallation

```bash
helm uninstall hff-app -n hff-dev
```

## Support

For issues or questions about this Helm chart, refer to:
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- Chart repository and maintainers

## License

This Helm chart is provided as part of the HFF project.
