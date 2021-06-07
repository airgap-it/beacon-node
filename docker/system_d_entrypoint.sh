#!/bin/sh
sed -i "s/{{SERVER_NAME}}/$SERVER_NAME/g" /config/homeserver.yaml
sed -i "s/{{DB_HOST}}/$DB_HOST/g" /config/homeserver.yaml
sed -i "s/{{DB_USER}}/$DB_USER/g" /config/homeserver.yaml
sed -i "s/{{DB_PASS}}/$DB_PASS/g" /config/homeserver.yaml
sed -i "s/{{DB_NAME}}/$DB_NAME/g" /config/homeserver.yaml
sed -i "s/{{SIGNING_KEY}}/$SIGNING_KEY/g" /config/signing.key

/usr/local/bin/wait-for.sh $DB_HOST:5432

systemctl start matrix-synapse.service
systemctl enable matrix-synapse-worker@woker1.service
systemctl enable matrix-synapse-worker@woker2.service
systemctl start matrix-synapse.target.service
