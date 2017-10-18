import pytest

from ethereum import utils
from tests.setup_transaction_tests import chain as s, tester as t, ethereum_utils as u, check_gas, \
    get_contract_with_gas_estimation, get_contract


def sign(message, key):
    _hash = utils.sha3(message)
    return _hash, utils.ecsign(_hash, key)


_hash, sigdata = sign("test message", t.k0)
v, r, s = sigdata
sig = utils.encode_int32(r) + utils.encode_int32(s) + utils.encode_int(v)


code = """
def extract_v(sig: bytes <= 66) -> num256:
    s = slice(sig, start=64, len=1)
    return as_num256(bytes_to_num(s))
"""
code = """
def extract_v(sig: bytes <= 96) -> bytes <= 96:
    return slice(sig, start=64, len=1)
"""
c = get_contract(code)
c.extract_v(sig)
