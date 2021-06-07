FROM matrixdotorg/synapse:v1.35.1
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

# RUN systemctl daemon-reload

COPY wait-for.sh /usr/local/bin/
# COPY template_entrypoint.sh /usr/local/bin/
COPY system_d_entrypoint.sh /usr/local/bin/


ENTRYPOINT ["/usr/local/bin/system_d_entrypoint.sh"]
# ENTRYPOINT ["/usr/local/bin/template_entrypoint.sh"]
