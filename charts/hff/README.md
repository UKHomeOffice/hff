# HFF App Helm Chart

A comprehensive Helm chart for deploying the HFF (HOF Feedback Form) application on Kubernetes, including support for Redis caching, Nginx proxy, ingress, and network policies.

## Overview

This Helm chart packages the HFF application with all its components:
- **Application Deployment**: Main HFF app with Nginx proxy sidecar
- **Redis Cache**: Session and data caching
- **Services**: ClusterIP services for app and Redis
- **Ingress**: External and internal ingress with TLS support
- **Network Policies**: Security controls for pod-to-pod communication
- **ConfigMaps**: Application configuration management

## Chart Structure

```
./
├── Chart.yaml                      # Chart metadata
├── values.yaml                     # Default values
├── README.md                       # This file
└── templates/
    ├── _helpers.tpl               # Template helpers and variables
    ├── app-deployment.yaml        # Application deployment
    ├── app-service.yaml           # Application service
    ├── app-configmap.yaml         # Application configuration
    ├── app-ingress-external.yaml  # External ingress
    ├── app-ingress-internal.yaml  # Internal ingress
    ├── app-networkpolicy-egress.yaml
    ├── app-networkpolicy-external.yaml
    ├── app-networkpolicy-internal.yaml
    ├── redis-deployment.yaml      # Redis deployment
    ├── redis-service.yaml         # Redis service
    ├── redis-configmap.yaml       # Redis configuration
    ├── redis-networkpolicy.yaml   # Redis network policy
    └── external-secrets.yaml
```

## Configuration

### Key Parameters

#### Global Settings
```yaml
global:
  namespace: <namespace>
  environment: <environment>
```

#### Application
```yaml
app:
  name: <app-name>
  replicas: 1

image:
  repository: <image-repository>
  tag: <image-tag>
  pullPolicy: Always

nginx:
  image: <nginx-image>
  env:
    - name: <nginx-env-var-name>
      value: <nginx-env-var-value>
```

#### Labels

```yaml
commonLabels:
  team: platform
  owner: app-team
```

Any key/value pairs under `commonLabels` are added to app and redis Deployment metadata labels and pod template labels.

#### Ingress Configuration
```yaml
ingress:
  externalEnabled: true
  internalEnabled: true
  external:
    className: "<external-ingress-class>"
    host: "<external-hostname>"
    annotations: {}
  internal:
    className: "<internal-ingress-class>"
    host: "<internal-hostname>"
    annotations: {}
```

Set `externalEnabled` and `internalEnabled` according to the ingress endpoints you need.
When an ingress is enabled, both `className` and `host` are required for that ingress.

#### Redis Configuration
```yaml
redis:
  enabled: true
  image: <redis-image>
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

#### Required Secret Inputs
The application expects three Kubernetes Secret references to be provided through values:

```yaml
secrets:
  sessionSecret:
    name: <session-secret-name>
    key: <session-secret-key>
  notifyKey:
    name: <notify-secret-name>
    key: <notify-secret-key>
  queryKey:
    name: <query-secret-name>
    key: <query-secret-key>
```

If `externalSecrets.enabled` is used, these secret names/keys are still the inputs the application consumes.

For External Secrets integration, each secret entry can also include:

```yaml
secrets:
  sessionSecret:
    remoteKey: <remote-secret-name-or-path>
    remoteProperty: <optional-property-name>
```

- `remoteKey` is the upstream secret name/path in the external provider; when set, an `ExternalSecret` is rendered for that entry.
- `remoteProperty` is used to select a specific field from the upstream secret referenced by `remoteKey`.

The External Secrets store reference is configured separately:

```yaml
externalSecrets:
  enabled: true
  secretStoreRef:
    name: <secret-store-name>
    kind: SecretStore
```

`secretStoreRef` points to an existing `SecretStore` (or `ClusterSecretStore`) resource where provider details (for example AWS Secrets Manager region/auth) are defined.

#### Environment Variables From A Secret

Config that should not be held in the deployment repository can be supplied from a Secret instead of the ConfigMap. Every key in the Secret becomes an environment variable of the same name, so keys must be valid environment variable names.

```yaml
envFromSecret:
  enabled: true
  name: hff-app-config
  remoteKey: <remote-secret-name-or-path>
```

- `name` is the Kubernetes Secret mounted into the app container via `envFrom`.
- `remoteKey` is optional. When set alongside `externalSecrets.enabled`, an `ExternalSecret` is rendered that extracts every property of the remote secret into `name`. Leave it empty when the Secret is created outside this chart.

The remote secret is expected to be a JSON object whose keys are the environment variable names, for example:

```json
{
  "FEEDBACK_INBOX": "someone@example.gov.uk",
  "FEEDBACK_TEMPLATE_ID": "00000000-0000-0000-0000-000000000000"
}
```

Precedence is worth noting. `envFrom` sources are applied in order, so this Secret overrides any key of the same name in the ConfigMap. Variables set explicitly in the container `env` list (`TZ`, `NODE_TLS_REJECT_UNAUTHORIZED`, `REDIS_PORT`, `REDIS_HOST`, `USE_MOCKS`, `SESSION_SECRET`, `NOTIFY_KEY`, `QUERY_KEY`) always win and cannot be overridden this way.

## Customization

### Custom ConfigMap Values

Add application-specific configuration in `values.yaml`:

```yaml
configMap:
  data:
    APP_SETTING_1: "value1"
    APP_SETTING_2: "value2"
    REDIS_CLUSTER: "<redis-service-fqdn>"
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

## Health Checks

Health checks are enabled by default:

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

The nginx sidecar and Redis container also use TCP liveness and readiness probes by default. Configure their timings under `nginx.healthChecks` and `redis.healthChecks`.

## Availability

Pod anti-affinity is enabled by default to spread application and Redis replicas across availability zones when possible:

```yaml
podAntiAffinity:
  enabled: true
```

For application deployments with more than one replica, a Pod Disruption Budget is enabled by default:

```yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

## Security

### Network Policies
Network policies restrict traffic to and from the application:
- External ingress from namespaces labeled `name=ingress-external` and optional CIDRs in `networkPolicies.externalIngressCIDRs`
- Internal ingress from namespaces labeled `name=ingress-internal` and optional CIDRs in `networkPolicies.internalIngressCIDRs`
- Redis access only from application pods

Enable/disable with:
```yaml
networkPolicies:
  enabled: true
  externalIngress: true
  internalIngress: true
  internalIngressCIDRs: []
  externalIngressCIDRs: []
  redisAccess: true
```

#### Why the CIDR lists matter

On the Core Cloud EKS clusters no namespace carries the `name=ingress-internal` or
`name=ingress-external` label, so those namespace selectors match nothing. Under
default-deny the CIDR lists are what actually permit load balancer traffic and
health checks.

Both ingresses use `alb.ingress.kubernetes.io/target-type: ip`, so the ALB connects
directly to pod IPs from its own ENIs rather than via a node port. The CIDRs must
therefore be the load balancer subnets:

| List | Subnets |
| --- | --- |
| `internalIngressCIDRs` | tagged `kubernetes.io/role/internal-elb` |
| `externalIngressCIDRs` | tagged `kubernetes.io/role/elb` |

If you enable an ingress and leave its list empty, the ALB will be created and its
listener rule will be correct, but it will not be able to reach the pods. Targets
report unhealthy and requests return 503.

### Security Context
All containers run as non-root:
```yaml
securityContext:
  runAsNonRoot: true
```