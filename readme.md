# Beacon Node

A custom [Synapse](https://github.com/element-hq/synapse) Docker image with cryptographic authentication, worker support, and the beacon info module.

## What's different from upstream Synapse

- **Crypto auth provider** (`crypto_auth_provider.py`) — authentication via cryptographic signatures
- **Beacon info module** (`beacon_info_module.py`) — exposes `/_synapse/client/beacon/info`
- **pysodium** and **psycopg2** pre-installed
- **Worker mode** enabled by default (1 main process + 4 workers)
- **Max event size** increased from 64KB to 1MB
- Media repo disabled (pure communication transport layer)

## Quick start with Docker Compose

```bash
git clone https://github.com/apham0001/beacon-node.git
cd beacon-node/docker-compose
# Edit docker-compose.yml: set SERVER_NAME and SIGNING_KEY
docker compose up -d
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SERVER_NAME` | Yes | Matrix server FQDN (e.g. `beacon-node-1.octez.io`) |
| `DB_HOST` | Yes | PostgreSQL hostname |
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASS` | Yes | PostgreSQL password |
| `DB_NAME` | Yes | PostgreSQL database name |
| `SIGNING_KEY` | Yes | Ed25519 signing key (see below) |
| `SERVER_REGION` | Yes | Geographic region for beacon info |

### Generating a signing key

```bash
docker run --rm --entrypoint="" ghcr.io/apham0001/beacon-node:latest \
  python -c "import signedjson.key, sys; signedjson.key.write_signing_keys(sys.stdout, [signedjson.key.generate_signing_key('0')])"
```

## Ports

| Port | Service |
|------|---------|
| 8008 | Main Synapse (client + federation) |
| 8083 | Worker 1 |
| 8084 | Worker 2 |
| 8085 | Worker 3 |
| 8086 | Worker 4 |

Route all external traffic (443, 8448) to port 8008 with TLS termination.

## Running with Docker

```bash
docker run -d --name beacon-node \
    -p 8008:8008 \
    -e SERVER_NAME=matrix.example.com \
    -e DB_HOST=postgres \
    -e DB_USER=synapse \
    -e DB_NAME=synapse \
    -e DB_PASS=password \
    -e SIGNING_KEY="ed25519 a_0 <your-key>" \
    -e SERVER_REGION=EU \
    ghcr.io/apham0001/beacon-node:latest
```

## Building the image

```bash
cd docker
docker build -t beacon-node .
```

## Helm chart

A Helm chart is available for Kubernetes deployments. See [tezos-infra/iac/charts/beacon-node](https://gitlab.com/tezos-infra/iac/charts/-/tree/main/beacon-node).

## License

[MIT](LICENSE)
