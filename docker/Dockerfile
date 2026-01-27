FROM ghcr.io/element-hq/synapse:latest
LABEL maintainer="AirGap Team <hi@airgap.it>"

# RUN apk add libsodium-dev gcc
RUN apt-get update && apt-get install -y libsodium-dev gcc

RUN pip install psycopg2 pysodium

RUN mkdir -p /keys

COPY docker/homeserver.yaml /config/
COPY docker/synapse.log.config /config/
COPY docker/synapse_master.service /etc/systemd/system/
COPY docker/synapse_worker@.service /etc/systemd/system/
COPY docker/matrix_synapse.target /etc/systemd/system/
COPY docker/workers /config/workers
COPY docker/shared_config.yaml /config/

COPY docker/beacon_info_module.py /usr/local/lib/python3.13/site-packages/
COPY docker/crypto_auth_provider.py /usr/local/lib/python3.13/site-packages/

# run change on max size
RUN sed -i 's/65536/1048576/' /usr/local/lib/python3.13/site-packages/synapse/api/constants.py

COPY docker/wait-for.sh /usr/local/bin/
COPY docker/synctl_entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/synctl_entrypoint.sh"]
