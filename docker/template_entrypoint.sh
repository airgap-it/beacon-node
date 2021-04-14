#!/bin/sh
sed -i "s/{{SERVER_NAME}}/$SERVER_NAME/g" /config/homeserver.yaml
sed -i "s/{{DB_HOST}}/$DB_HOST/g" /config/homeserver.yaml
sed -i "s/{{DB_USER}}/$DB_USER/g" /config/homeserver.yaml
sed -i "s/{{DB_PASS}}/$DB_PASS/g" /config/homeserver.yaml
sed -i "s/{{DB_NAME}}/$DB_NAME/g" /config/homeserver.yaml
sed -i "s/{{SIGNING_KEY}}/$SIGNING_KEY/g" /config/signing.key

python -m synapse.app.homeserver --config-path /config --keys-directory /data
/usr/local/bin/wait-for.sh $DB_HOST:5432 -- python -m synapse.app.homeserver --config-path /config --keys-directory /data
