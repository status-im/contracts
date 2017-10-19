import pytest

from ethereum import utils
from ethereum.tools import tester

from tests.setup_transaction_tests import assert_tx_failed, get_log


@pytest.fixture
def identiy_tester():
    tester.s = tester.Chain()
    from viper import compiler
    tester.languages['viper'] = compiler.Compiler()
    contract_code = open('contracts/erc_725.v.py').read()
    tester.c = tester.s.contract(
        contract_code,
        language='viper',
        args=[]
    )
    return tester


def sign(_hash, key):
    v, r, s = utils.ecsign(_hash, key)
    return utils.encode_int32(r) + utils.encode_int32(s) + utils.encode_int(v)


def test_initial_state(identiy_tester):
    c = tester.c
    assert c.getKeysByType(1)[0] == '0x' + tester.a0.hex()
