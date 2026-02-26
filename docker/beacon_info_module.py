import json
from twisted.web.resource import Resource
import logging
import time
import os

logger = logging.getLogger(__name__)


class WellKnownServerResource(Resource):
    isLeaf = True

    def render_GET(self, request):
        server_name = os.environ.get("SERVER_NAME", "localhost")
        request.setHeader(b"content-type", b"application/json")
        return json.dumps({"m.server": f"{server_name}:443"}).encode("utf-8")


class WellKnownClientResource(Resource):
    isLeaf = True

    def render_GET(self, request):
        server_name = os.environ.get("SERVER_NAME", "localhost")
        request.setHeader(b"content-type", b"application/json")
        request.setHeader(b"Access-Control-Allow-Origin", b"*")
        return json.dumps({"m.homeserver": {"base_url": f"https://{server_name}"}}).encode("utf-8")


class WellKnownMatrixResource(Resource):
    """Parent resource for /.well-known/matrix/* endpoints."""

    def __init__(self):
        super().__init__()
        self.putChild(b"server", WellKnownServerResource())
        self.putChild(b"client", WellKnownClientResource())


class BeaconInfoModule(Resource):
    def __init__(self, config, api):
        super().__init__()
        logger.info(f"init called with config: {config}")
        self.config = config
        self.api = api
        self.api.register_web_resource(path="/_synapse/client/beacon/info", resource=self)
        self.api.register_web_resource(path="/.well-known/matrix", resource=WellKnownMatrixResource())

    def render(self, request):
        request.setHeader(b"content-type", b"application/json; charset=utf-8")
        request.setHeader(b"Access-Control-Allow-Origin", b"*")
        return json.dumps({
            "region": os.environ.get("SERVER_REGION", "region not set"),
            "known_servers": self.config.get("known_servers", []),
            "timestamp": time.time()
            }).encode("utf-8")
