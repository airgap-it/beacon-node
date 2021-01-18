#!/bin/sh
HS_PATH="/config/$HS_FILE_NAME"
sed -i "s/{{SERVER_NAME}}/$SERVER_NAME/g" $HS_PATH
sed -i "s/{{DB_HOST}}/$DB_HOST/g" $HS_PATH
sed -i "s/{{DB_USER}}/$DB_USER/g" $HS_PATH
sed -i "s/{{DB_PASS}}/$DB_PASS/g" $HS_PATH
sed -i "s/{{DB_NAME}}/$DB_NAME/g" $HS_PATH

python -m synapse.app.homeserver --config-path $HS_PATH --keys-directory /data --generate-keys
/usr/local/bin/wait-for.sh $DB_HOST:5432 -- python -m synapse.app.homeserver --config-path /config --keys-directory /data