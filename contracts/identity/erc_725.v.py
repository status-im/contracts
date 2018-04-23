# Events of the identiy contract.
KeyAdded: __log__({key: indexed(address), type: indexed(num256)})
KeyRemoved: __log__({key: indexed(address), type: indexed(num256)})
ExecutionRequested: __log__({executionId: indexed(num256), to: indexed(address), value: indexed(num256), data: bytes <= 4096})
Executed: __log__({executionId: indexed(num256), to: indexed(address), value: indexed(num256), data: bytes <= 4096})

# Events of the identity holder.
ClaimRequest: __log__({claimRequestId: indexed(num256), claimType: indexed(num256), issuer: indexed(address), signatureTupe: num256, signature: bytes <= 4096, uri: bytes <= 4096})  # noqa
ClaimRequested: __log__({claimRequestId: indexed(num256), claimType: indexed(num256), issuer: indexed(address), signatureTupe: num256, signature: bytes <= 4096, uri: bytes <= 4096})  # noqa
ClaimAdded: __log__({claimId: indexed(num256), issuer: indexed(address), claimType: indexed(num256), signatureTupe: num256, signature: bytes <= 4096, uri: bytes <= 4096})  # noqa
ClaimRemoved: __log__({claimId: indexed(num256), issuer: indexed(address), claimType: indexed(num256), signatureTupe: num256, signature: bytes <= 4096, uri: bytes <= 4096})  # noqa
ClaimChanged:__log__({claimId: indexed(num256), issuer: indexed(address), claimType: indexed(num256), signatureTupe: num256, signature: bytes <= 4096, uri: bytes <= 4096})  # noqa

# Key management types
keys: address[20]
key_types: num[20]
key_count: num
execute_list: {
    action_type: num,
    to: address,
    data: bytes <= 4096,
    value: num,
    approved: bool
}[num]
execute_count: num

# ActionTypes:
# ClaimRequested == 1

# Claims
claims: {
    claimId: bytes32,
    claimType: num,
    issuer: address,
    signatureType: num,
    signature: bytes <= 4096,
    data: bytes <= 4096,
    uri: bytes <= 4096,
    approved: bool
}[num]
claim_count: num


def __init__():
    self.keys[0] = msg.sender
    self.key_types[0] = 1
    self.key_count = 1
    log.KeyAdded(msg.sender, as_num256(1))


@constant
def getKeyType(_key: address) -> num256:

    for i in range(0, 20):

        if i >= self.key_count:
            break

        if self.keys[i] == _key:
            return as_num256(self.key_types[i])

    return as_num256(0)


def getKeysByType(_type: num(num256)) -> address[20]:
    assert _type >= 1
    assert _type <= 4

    outarr: address[20]

    j = 0
    for i in range(0, 20):

        if i >= self.key_count:
            break

        if self.key_types[i] == _type:
            outarr[j] = self.keys[i]
            j += 1

    return outarr

# Permission check function.
# Any modifying of keys should be handled by key holder of type 1 only.
@internal
def from_key_type(_from: address, key_type: num) -> bool:

    for i in range(0, 20):

        if self.keys[i] == _from and self.key_types[i] == key_type:
            return True

    return False


def addKey(_key: address, _type: num(num256)) -> bool:
    assert _type >= 1
    assert _type <= 4
    assert self.key_count <= 20

    if not self.from_key_type(msg.sender, 1):
        return False

    self.keys[self.key_count] = _key
    self.key_types[self.key_count] = 1
    self.key_count += 1
    log.KeyAdded(_key, as_num256(_type))

    return True


def removeKey(_key: address) -> bool:

    if not self.from_key_type(msg.sender, 1):
        return False

    for i in range(0, 20):

        if i >= self.key_count:
            break

        if self.keys[i] == _key:
            self.keys[i] = 0x0000000000000000000000000000000000000000
            log.KeyRemoved(_key, as_num256(self.key_types[i]))
            return True

    return False


def replaceKey(_oldKey: address, _newKey: address) -> bool:

    if not self.from_key_type(msg.sender, 1):
        return False

    for i in range(0, 20):

        if i >= self.key_count:
            break

        if self.keys[i] == _oldKey:
            self.keys[i] = _newKey
            return True

    return False


def execute(_to: address, _value: num(num256), _data: bytes <= 4096) -> num256:
    self.execute_list[self.execute_count] = {
        action_type: 0,  # defer this from _data ?
        to: _to,
        value: _value,
        data: _data,
        approved: False
    }

    # log.ExecutionRequested(as_num256(self.execute_count), _to, as_num256(_value), _data)
    self.execute_count += 1
    return as_num256(0)


def approve(executeId: num(num256)) -> bool:

    if not (self.from_key_type(msg.sender, 1) or self.from_key_type(msg.sender, 4)):
        return False

    e = self.execute_list[executeId]

    if e.action_type == 1:  # Is a claim, move to claims array.
        self.claims[bytes_to_num(slice(e.data, start=0, len=32))].approved = True
        e.approved = True
    else:
        return False  # Unsupported claimType, can't excute it.

    # execute action.
    # raw call etc.
    # log.Approved(executionId, e._to, e._value, e._data)

    return True


def addClaim(_claimType: num(num256), issuer: address, signatureType: num(num256),
             _signature: bytes <= 4096, _data: bytes <= 4096, _uri: bytes <= 4096) -> bytes32:

    assert signatureType == 1  # supported signature types.
    assert issuer == msg.sender

    claim_data = concat(as_bytes32(self), as_bytes32(_claimType), _data)
    claim_hash = sha3(claim_data)
    claimId = sha3(concat(as_bytes32(issuer), as_bytes32(_claimType)))

    self.claims[self.claim_count] = {
        claimId: claimId,
        claimType: _claimType,
        issuer: issuer,
        signatureType: signatureType,
        signature: _signature,
        data: _data,
        uri: _uri,
        approved: False
    }

    self.execute_list[self.execute_count] = {
        action_type: 1,  # for now execType == 1, means claim action
        to: self,
        value: 0,
        data: concat(as_bytes32(self.claim_count), ""),
        approved: False
    }

    self.claim_count += 1
    self.execute_count += 1

    return claimId


def getClaim(_claimId: bytes32) -> (num256, address, num256, bytes <= 4096, bytes <= 4096, bytes <= 4096):

    for i in range(0, 20):
        if i >= self.claim_count:
            break

        if _claimId == self.claims[i].claimId and self.claims[i].approved:
            claim = self.claims[i]
            return claim.claimType, claim.issuer, claim.signatureType, claim.signature, claim.data, claim.uri


def getClaimIdsByType(_claimType: num(num256)) -> bytes32[20]:

    outarr: bytes32[20]

    j = 0
    for i in range(0, 20):
        if i >= self.claim_count:
            break

        if self.claims[i].claimType == _claimType and self.claims[i].approved:
            outarr[j] = self.claims[i].claimId
            j += 1

    return outarr
