FROM matrixdotorg/synapse:v1.5.0-py3
LABEL maintainer="AirGap Team <hi@airgap.it>"

RUN apk add libsodium-dev gcc

RUN pip install psycopg2 pysodium

RUN mkdir -p /keys

COPY crypto_auth_provider.py /usr/local/lib/python3.7/site-packages/
COPY homeserver.yaml /config/
COPY homeserver-dev.yaml /config/

COPY wait-for.sh /usr/local/bin/
COPY template_entrypoint.sh /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/template_entrypoint.sh"]