# beacon-node

![Version: 0.4.1](https://img.shields.io/badge/Version-0.4.1-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 1.148.0](https://img.shields.io/badge/AppVersion-1.148.0-informational?style=flat-square)

A Helm chart for deploying Beacon Node (Matrix Synapse fork with crypto authentication)

**Homepage:** <https://github.com/apham0001/beacon-node>

## Source Code

* <https://github.com/apham0001/beacon-node>

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://kubelauncher.github.io/charts | postgresql | 0.2.8 |
| https://kubelauncher.github.io/charts | redis | 0.2.15 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| affinity | object | `{}` | Affinity rules for pod scheduling |
| existingSigningKeySecret | object | `{"key":"SIGNING_KEY","name":""}` | Use an existing secret for the signing key instead of creating one If set, signingKey value is ignored |
| existingSigningKeySecret.key | string | `"SIGNING_KEY"` | Key in the secret that contains the signing key value |
| existingSigningKeySecret.name | string | `""` | Name of the existing secret containing the signing key |
| externalDatabase.database | string | `"synapse"` | External PostgreSQL database name |
| externalDatabase.host | string | `""` | External PostgreSQL host |
| externalDatabase.password | string | `""` | External PostgreSQL password |
| externalDatabase.port | int | `5432` | External PostgreSQL port |
| externalDatabase.username | string | `"synapse"` | External PostgreSQL username |
| fullnameOverride | string | `""` | Override the full release name |
| image.digest | string | `""` | Image digest (optional, for pinning exact image version) Example: "sha256:abc123..." |
| image.pullPolicy | string | `"Always"` | Image pull policy |
| image.repository | string | `"ghcr.io/apham0001/beacon-node"` | Container image repository |
| image.tag | string | `"latest"` | Image tag |
| imagePullSecrets | list | `[]` | Image pull secrets for private registries |
| ingress.annotations | object | `{"cert-manager.io/cluster-issuer":"letsencrypt-prod","nginx.ingress.kubernetes.io/proxy-connect-timeout":"60","nginx.ingress.kubernetes.io/proxy-read-timeout":"300","nginx.ingress.kubernetes.io/proxy-send-timeout":"300"}` | Ingress annotations |
| ingress.className | string | `"nginx"` | Ingress class name |
| ingress.enabled | bool | `false` | Enable ingress |
| ingress.hosts | list | `[{"host":"matrix.example.com","paths":[{"path":"/","pathType":"Prefix"}]}]` | Ingress hosts configuration |
| ingress.tls | list | `[{"hosts":["matrix.example.com"],"secretName":"beacon-node-tls"}]` | Ingress TLS configuration |
| livenessProbe.failureThreshold | int | `3` |  |
| livenessProbe.httpGet.path | string | `"/health"` |  |
| livenessProbe.httpGet.port | string | `"http"` |  |
| livenessProbe.initialDelaySeconds | int | `30` |  |
| livenessProbe.periodSeconds | int | `10` |  |
| livenessProbe.timeoutSeconds | int | `5` |  |
| monitoring.enabled | bool | `false` | Enable ServiceMonitor for Prometheus scraping |
| monitoring.interval | string | `"30s"` | Scrape interval |
| monitoring.path | string | `"/_synapse/metrics"` | Metrics endpoint path |
| monitoring.prometheusRelease | string | `"prometheus-stack"` | Prometheus release label for service discovery |
| monitoring.scrapeTimeout | string | `"10s"` | Scrape timeout |
| nameOverride | string | `""` | Override the chart name |
| nodeSelector | object | `{}` | Node selector for pod scheduling |
| persistence.accessModes | list | `["ReadWriteOnce"]` | Access modes |
| persistence.enabled | bool | `true` | Enable persistence for Synapse data |
| persistence.size | string | `"5Gi"` | Storage size |
| persistence.storageClass | string | `""` | Storage class (leave empty for default) |
| podAnnotations | object | `{}` | Pod annotations |
| podSecurityContext | object | `{}` | Pod security context |
| postgresql.auth.database | string | `"synapse"` | PostgreSQL database name |
| postgresql.auth.password | string | `""` | PostgreSQL password (REQUIRED if postgresql.enabled=true) |
| postgresql.auth.username | string | `"synapse"` | PostgreSQL username |
| postgresql.enabled | bool | `true` | Deploy PostgreSQL as a subchart |
| postgresql.primary.configuration | string | `"max_connections = 300\n"` | PostgreSQL configuration Synapse workers use cp_min=20, cp_max=80 connections per process With 4 workers + 1 main: 5 * 80 + buffer = 300 |
| postgresql.primary.initdb | object | `{"args":"--encoding=UTF8 --lc-collate=C --lc-ctype=C"}` | initdb configuration (IMPORTANT: Synapse requires C locale) |
| postgresql.primary.persistence.enabled | bool | `true` | Enable persistence for PostgreSQL |
| postgresql.primary.persistence.size | string | `"10Gi"` | Storage size for PostgreSQL |
| postgresql.primary.resources | object | `{"limits":{"cpu":"500m","memory":"1Gi"},"requests":{"cpu":"100m","memory":"256Mi"}}` | PostgreSQL resource limits |
| readinessProbe.failureThreshold | int | `3` |  |
| readinessProbe.httpGet.path | string | `"/health"` |  |
| readinessProbe.httpGet.port | string | `"http"` |  |
| readinessProbe.initialDelaySeconds | int | `10` |  |
| readinessProbe.periodSeconds | int | `5` |  |
| readinessProbe.timeoutSeconds | int | `3` |  |
| redis.architecture | string | `"standalone"` | Redis architecture (standalone or replication) |
| redis.auth.enabled | bool | `false` | Disable Redis authentication (Synapse default) |
| redis.enabled | bool | `true` | Deploy Redis as a subchart (required for workers) |
| redis.master.persistence.enabled | bool | `true` | Enable persistence for Redis |
| redis.master.persistence.size | string | `"1Gi"` | Storage size for Redis |
| redis.master.resources | object | `{"limits":{"cpu":"200m","memory":"256Mi"},"requests":{"cpu":"50m","memory":"64Mi"}}` | Redis resource limits |
| registrationSharedSecret | string | `""` | Shared secret for user registration (optional) |
| replicaCount | int | `1` | Number of replicas (only 1 supported due to Synapse architecture) |
| resources.limits.cpu | string | `"1000m"` |  |
| resources.limits.memory | string | `"2Gi"` |  |
| resources.requests.cpu | string | `"250m"` |  |
| resources.requests.memory | string | `"512Mi"` |  |
| securityContext | object | `{}` | Container security context |
| serverName | string | `"matrix.example.com"` | Matrix server name (FQDN). This MUST match your domain. Example: matrix.example.com |
| serverRegion | string | `"EU"` | Geographic region for beacon info endpoint |
| service.port | int | `8008` | Main client/federation port |
| service.type | string | `"ClusterIP"` | Service type (ClusterIP, NodePort, LoadBalancer) |
| serviceAccount.annotations | object | `{}` | Service account annotations |
| serviceAccount.create | bool | `true` | Create a service account |
| serviceAccount.name | string | `""` | Service account name (generated if not set) |
| signingKey | string | `""` | Ed25519 signing key for Matrix federation Format: "ed25519 a_XXXX <base64-encoded-32-byte-key>" IMPORTANT: The base64-encoded seed MUST decode to exactly 32 bytes! Generate with:   python3 -c "import base64,os; print(f'ed25519 a_{os.urandom(2).hex()} {base64.b64encode(os.urandom(32)).decode()}')" If not provided, a deterministic key is auto-generated based on release name. WARNING: Auto-generated keys are NOT secure for production - always provide your own key! |
| tolerations | list | `[]` | Tolerations for pod scheduling |
| workers.enabled | bool | `true` | Enable Synapse workers (4 generic workers on ports 8083-8086) Worker count is fixed at 4 in the Docker image (hardcoded worker configs) |

----------------------------------------------
Autogenerated from chart metadata using [helm-docs v1.14.2](https://github.com/norwoodj/helm-docs/releases/v1.14.2)
