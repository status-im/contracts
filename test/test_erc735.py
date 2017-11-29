import pytest

from ethereum import utils
from ethereum.tools import tester

from tests.setup_transaction_tests import assert_tx_failed, get_log


@pytest.fixture
def identiy_tester():
    tester.s = tester.Chain()
    from viper import compiler
    tester.languages['viper'] = compiler.Compiler()
    contract_code = open('contracts/erc_735.v.py').read()
    tester.c = tester.s.contract(
        contract_code,
        language='viper',
        args=[]
    )
    return tester


def sign(_hash, key):
    v, r, s = utils.ecsign(_hash, key)
    return utils.encode_int32(r) + utils.encode_int32(s) + utils.encode_int(v)


def test_addClaim(identiy_tester):
    c = tester.c
    issuer, k1 = tester.a1, tester.k1
    data = b"hasbeans"
    uri = b"http://www.google.com"
    claimType = 1

    claim_data = utils.encode_int32(utils.decode_int256(c.address)) + utils.encode_int32(claimType) + data
    claim_hash = utils.sha3(claim_data)
    signature = sign(claim_hash, k1)

    claimId = c.addClaim(claimType, issuer, 1, signature, data, uri, sender=k1)
    assert claimId == utils.sha3(claim_hash + utils.encode_int32(tester.s.head_state.timestamp))
