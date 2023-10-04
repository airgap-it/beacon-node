FROM matrixdotorg/synapse:v1.93.0
LABEL maintainer="AirGap Team <hi@airgap.it>"

# RUN apk add libsodium-dev gcc
RUN apt-get update && apt-get install -y libsodium-dev gcc

RUN pip install psycopg2 pysodium

RUN mkdir -p /keys

COPY crypto_auth_provider.py /usr/local/lib/python3.8/site-packages/
COPY homeserver.yaml /config/
COPY synapse.log.config /config/
COPY signing.key /config/
COPY synapse_master.service /etc/systemd/system/
COPY synapse_worker@.service /etc/systemd/system/
COPY matrix_synapse.target /etc/systemd/system/
COPY workers /config/workers
COPY shared_config.yaml /config/
COPY beacon_info_module.py /usr/local/lib/python3.8/site-packages/

# run change on max size
RUN sed -i 's/65536/1048576/' /usr/local/lib/python3.11/site-packages/synapse/api/constants.py

COPY wait-for.sh /usr/local/bin/
COPY synctl_entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/synctl_entrypoint.sh"]