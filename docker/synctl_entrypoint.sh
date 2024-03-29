#!/bin/sh
sed -i "s/{{SERVER_NAME}}/$SERVER_NAME/g" /config/homeserver.yaml
sed -i "s/{{SERVER_NAME}}/$SERVER_NAME/g" /config/shared_config.yaml
sed -i "s/{{DB_HOST}}/$DB_HOST/g" /config/homeserver.yaml
sed -i "s/{{DB_USER}}/$DB_USER/g" /config/homeserver.yaml
sed -i "s/{{DB_PASS}}/$DB_PASS/g" /config/homeserver.yaml
sed -i "s/{{DB_NAME}}/$DB_NAME/g" /config/homeserver.yaml
echo "${SIGNING_KEY}" > /config/signing.key
/usr/local/bin/wait-for.sh $DB_HOST:5432

# synctl start /config/homeserver.yaml 
# synctl start /config/shared_config.yaml.yaml -w /config/workers/worker1.yaml
# synctl start /config/shared_config.yaml -w /config/workers/worker2.yaml
synctl start /config/homeserver.yaml -w /config/workers/main_process.yaml
synctl start /config/homeserver.yaml -w /config/workers/worker1.yaml
synctl start /config/homeserver.yaml -w /config/workers/worker2.yaml
synctl start /config/homeserver.yaml -w /config/workers/worker3.yaml
synctl start /config/homeserver.yaml -w /config/workers/worker4.yaml --no-daemonize
# systemctl daemon-reload
# systemctl start matrix-synapse.service
# systemctl enable matrix-synapse-worker@woker1.service
# systemctl enable matrix-synapse-worker@woker2.service
# systemctl start matrix-synapse.target.service
