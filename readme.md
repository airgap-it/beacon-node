
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
2. have that SSL/TLS setup for port 8448 and 443
3. forward SSL/TLS traffic from 8448 to 8008 of this container
4. forward SSL/TLS traffic from 443 to 8008 of this container

## Running beacon-node using docker

You can start beacon-node as follows (currently we support only postgres setups and expect that the domain given in "SERVER_NAME" is also where this container will be reachable on port 8080 for the letsencrypt request):

```
docker run -d --name beacon-node \
    --mount type=volume,src=synapse-data,dst=/data \
    -p 8080:8080 \
    -p 8008:8008 \
    -e SERVER_NAME=matrix.example.com \
    -e DB_HOST=postgres \
    -e DB_USER=synapse \
    -e DB_NAME=synapse \
    -e DB_PASS=password \
    airgapdocker/beacon-node:latest
```

## Running beacon-node using docker-compose

You can start beacon-node as follows (currently we support only postgres setups and expect that the domain given in "SERVER_NAME" is also where this container will be reachable):

```
git clone
cd beacon-node/samples
vim docker-compose.yml # edit according to your likings: SERVER_NAME must be changed!
docker-compose up -d
```

## Sample Nginx configuration

This is a sample configuration of `nginx` that will route all the traffic to the correct port. The certificates were added by Certbot and provided by letsencrypt.

```nginx

upstream matrix_workers {
        server localhost:8083;
        server localhost:8084;
        server localhost:8085;
        server localhost:8086;
    }

server {
    listen 8448 ssl;
    listen [::]:8448 ssl;

    server_name MY_SERVER_DOMAIN;
    
    location ~* ^(\/_matrix\/client\/(v2_alpha|r0)\/sync) {
         proxy_set_header Host $host;
         proxy_set_header   X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;                 
        proxy_pass         http://matrix_workers;           
         client_max_body_size 50M;
    }
 
    location ~* ^(\/_matrix\/client\/(api/v1|r0|unstable)\/rooms\/.*\/(join|invite|leave|ban|unban|kick)) {
        proxy_set_header Host $host;
        proxy_set_header   X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;                 
        proxy_pass         http://matrix_workers;           
        client_max_body_size 50M;
    }
 
 
   location ~* ^(\/_matrix\/client\/(api/v1|r0|unstable)\/login) {
        proxy_set_header Host $host;
        proxy_set_header   X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;                 
        proxy_pass         http://matrix_workers;           
        client_max_body_size 50M;
    }

    location / {
        proxy_set_header   X-Forwarded-For $remote_addr;
        proxy_set_header   Host $http_host;
        proxy_pass         http://localhost:8008;
    }

    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/MY_SERVER_DOMAIN/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/MY_SERVER_DOMAIN/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
```

## Running beacon-node using kubernetes

See the k8s folder in this project for a production ready k8s setup.

## Running beacon-node directly

Our requirements to any beacon-node installation are minimal. Check `docker/homeserver.yaml` for the configuration and make sure to place `docker/crypto_auth_provider.py` to a place where it can be picked up by beacon-node (the Dockerfile is quite straight forward and the best documentation).
