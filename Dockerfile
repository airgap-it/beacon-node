FROM matrixdotorg/synapse:v1.5.0-py3
LABEL maintainer="AirGap Team <hi@airgap.it>"

RUN apk add libsodium-dev gcc

RUN pip install psycopg2 pysodium

COPY crypto_auth_provider.py /usr/local/lib/python3.7/site-packages/