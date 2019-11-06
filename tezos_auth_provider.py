# Put this file in a place accessible by the synapse server

# Enable it in homeserver's config with:
# password_providers:
#   - module: 'tezos_auth_provider.TezosAuthProvider'
#     config:
#       enabled: true

# If desired, disable registration, to only allow auth through this provider:
# enable_registration: false

import logging
import time

from twisted.internet import defer
from pytezos.crypto import Key

__version__ = "0.1"
logger = logging.getLogger(__name__)


class TezosAuthProvider:
    __version__ = "0.1"

    def __init__(self, config, account_handler):
        self.account_handler = account_handler
        self.config = config
        self.hs_hostname = self.account_handler.hs.hostname
        self.log = logging.getLogger(__name__)

    @defer.inlineCallbacks
    def check_password(self, user_id: str, password: str):
        localpart = user_id.split(":", 1)[0][1:]
        signature_part = password.split(":", 1)[0]

        try:
            Key(localpart).verify(signature_part,
                                  "login{}".format(int(time.time()/(5*60))))
            if not (yield self.account_handler.check_user_exists(user_id)):
                self.log.info(
                    "First user login, registering: user=%r", user_id)
                yield self.account_handler.register(localpart=localpart.lower())
            defer.returnValue(True)
        except Exception as exception:
            self.log.info(
                "Got exception while verifying signature: "+str(exception))
            defer.returnValue(False)

    @staticmethod
    def parse_config(config):
        return config
