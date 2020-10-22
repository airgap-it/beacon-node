# Put this file in a place accessible by the synapse server

# Enable it in homeserver's config with:
# password_providers:
#   - module: 'crypto_auth_provider.CryptoAuthProvider'
#     config:
#       enabled: true

# If desired, disable registration, to only allow auth through this provider:
# enable_registration: false

import logging
import time

from twisted.internet import defer
import pysodium

__version__ = "0.1"
logger = logging.getLogger(__name__)


class CryptoAuthProvider:
    __version__ = "0.1"

    def __init__(self, config, account_handler):
        self.account_handler = account_handler
        self.config = config
        self.hs_hostname = self.account_handler.hs.hostname
        self.log = logging.getLogger(__name__)

    @defer.inlineCallbacks
    def check_password(self, user_id: str, password: str):
        public_key_hash = bytes.fromhex(user_id.split(":", 1)[0][1:])
        #signature_type = password.split(":")[0]
        signature = bytes.fromhex(password.split(":")[1])
        public_key = bytes.fromhex(password.split(":")[2])

        public_key_digest = pysodium.crypto_generichash(public_key, outlen=20)

        if public_key_hash.hex() == public_key_digest.hex():
            try:
                message_digest = pysodium.crypto_generichash(
                    u"login:{}".format(int(time.time()/(5*60))).encode(), outlen=32)
                pysodium.crypto_sign_verify_detached(
                    signature, message_digest, public_key)
                if not (yield self.account_handler.check_user_exists(user_id)):
                    self.log.info(
                        "First user login, registering: user=%r", user_id.lower())
                    yield self.account_handler.register(localpart=public_key_digest.hex())
                defer.returnValue(True)
            except Exception as exception:
                self.log.info(
                    "Got exception while verifying signature: "+str(exception))
                defer.returnValue(False)
        else:
            self.log.info(
                "pubkey hash did not match pubkey")
            defer.returnValue(False)

    @staticmethod
    def parse_config(config):
        return config
