[![Docker Pulls](https://img.shields.io/docker/pulls/airgapdocker/beacon-node)](https://hub.docker.com/r/airgapdocker/beacon-node)

# Beacon Node Docker

This Docker image will run Synapse as a single process and is a fork of the matrixdotorg/synapse docker image.

The big difference this image has is that it include pysodium and an auth provider that is compatible with cryptographic signatures: `crypto_auth_provider.py`

By default it uses a postgres database; and is hence suited for production use.

The image also does _not_ provide a TURN server.

## Volumes

By default, the image expects a single volume, located at `/data`, that will hold:

- keys;
- temporary data;

## Dependencies

We require a postgres database connection. The environment variable `SERVER_NAME` controls how your matrix node will be called and reached, this _needs_ to be a fqdn which will be forwarding requests on port 8080 and 8448 to this container.

## Service Ports

Port 8008 is required for the actual matrix service and will be your endpoint.

Note: in order for federation to work you will need:

1. SSL/TLS enabled for your domain
2. have that SSL/TLS setup for port 8448
3. forward SSL/TLS traffic from 8448 to 8008 of this container

## Running synapse using docker

You can start synapse as follows (currently we support only postgres setups and expect that the domain given in "SERVER_NAME" is also where this container will be reachable on port 8080 for the letsencrypt request):

```
docker run -d --name synapse \
    --mount type=volume,src=synapse-data,dst=/data \
    -p 8080:8080 \
    -p 8448:8448 \
    -e SERVER_NAME=matrix.example.com \
    -e DB_HOST=postgres \
    -e DB_USER=synapse \
    -e DB_NAME=synapse \
    -e DB_PASS=password \
    airgapdocker/tezos-synapse:v1.5.0-py3
```

## Running synapse using docker-compose

You can start synapse as follows (currently we support only postgres setups and expect that the domain given in "SERVER_NAME" is also where this container will be reachable):

```
git clone
cd tezos-synapse/samples
vim docker-compose.yml # edit according to your likings: SERVER_NAME must be changed!
docker-compose up -d
```

## Running synapse using kubernetes

See the k8s folder in this project for a production ready k8s setup.

## Running synapse directly

Our requirements to any synapse installation are minimal. Check `docker/homeserver.yaml` for the configuration and make sure to place `docker/crypto_auth_provider.py` to a place where it can be picked up by synapse (the Dockerfile is quite straight forward and the best documentation).
