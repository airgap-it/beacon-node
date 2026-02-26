FROM matrixdotorg/synapse:v1.148.0 AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends libsodium-dev gcc && \
    pip install --no-cache-dir psycopg2 pysodium && \
    rm -rf /var/lib/apt/lists/*

FROM matrixdotorg/synapse:v1.148.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends libsodium23 libpq5 && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get purge -y --auto-remove && \
    mkdir -p /keys

COPY --from=builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/

COPY crypto_auth_provider.py /usr/local/lib/python3.13/site-packages/
COPY homeserver.yaml /config/
COPY synapse.log.config /config/
COPY synapse_master.service /etc/systemd/system/
COPY synapse_worker@.service /etc/systemd/system/
COPY matrix_synapse.target /etc/systemd/system/
COPY workers /config/workers
COPY shared_config.yaml /config/
COPY beacon_info_module.py /usr/local/lib/python3.13/site-packages/

# run change on max size
RUN sed -i 's/65536/1048576/' /usr/local/lib/python3.13/site-packages/synapse/api/constants.py

COPY wait-for.sh /usr/local/bin/
COPY synctl_entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/synctl_entrypoint.sh"]
