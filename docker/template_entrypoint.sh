#!/bin/sh
sed -i "s/{{SERVER_NAME}}/$SERVER_NAME/g" /config/homeserver.yaml
sed -i "s/{{DB_HOST}}/$DB_HOST/g" /config/homeserver.yaml
sed -i "s/{{DB_USER}}/$DB_USER/g" /config/homeserver.yaml
sed -i "s/{{DB_PASS}}/$DB_PASS/g" /config/homeserver.yaml
sed -i "s/{{DB_NAME}}/$DB_NAME/g" /config/homeserver.yaml

python -m synapse.app.homeserver --config-path /config --keys-directory /data --generate-keys
/usr/local/bin/wait-for.sh postgres:5432 -- python -m synapse.app.homeserver --config-path /config --keys-directory /data