FROM matrixdotorg/synapse:v1.35.1
LABEL maintainer="AirGap Team <hi@airgap.it>"

# RUN apk add libsodium-dev gcc
RUN apt-get update && apt-get install -y libsodium-dev gcc

RUN pip install psycopg2 pysodium

RUN mkdir -p /keys

COPY crypto_auth_provider.py /usr/local/lib/python3.7/site-packages/
COPY homeserver.yaml /config/
COPY synapse.log.config /config/
COPY signing.key /config/

COPY wait-for.sh /usr/local/bin/
COPY template_entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/template_entrypoint.sh"]
