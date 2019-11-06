FROM matrixdotorg/synapse:v1.5.0-py3
LABEL maintainer="AirGap Team <hi@airgap.it>"

RUN apk add libsodium-dev libsodium git gcc make g++ zlib-dev gmp-dev

RUN pip install psycopg2 coincurve pycryptodome git+https://github.com/dcale/pytezos

COPY tezos_auth_provider.py /usr/local/lib/python3.7/site-packages/