import json
from twisted.web.resource import Resource
import logging
import time
import os

logger = logging.getLogger(__name__)

class BeaconInfoModule(Resource):
    def __init__(self, config, api):
        super().__init__()
        logger.info(f"init called with config: {config}")
        self.config = config
        self.api = api
        self.api.register_web_resource(path="/_synapse/client/beacon/info", resource=self)

    def render(self, request):
        request.setHeader(b"content-type", b"application/json; charset=utf-8")
        request.setHeader(b"Access-Control-Allow-Origin",b"*")
        return json.dumps({
            "region":os.environ.get("SERVER_REGION", "region not set"),
            "known_servers":self.config.get("known_servers",[]),
            "timestamp": time.time()
            }).encode("utf-8")
