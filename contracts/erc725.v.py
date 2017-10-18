# Key management types
keys: address[20]
key_types: num[20]
key_count: num

# Claim types
claims: {
    claimId: bytes32,
    claimType: num,
    issuer: address,
    signatureType: num,
    signature: bytes <= 4096,
    data: bytes <= 4096,
    uri: bytes <= 4096
}[num]
claim_count: num


def __init__():
    self.keys[0] = msg.sender
    self.key_types[0] = 1
    self.key_count = 1


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
def from_key_type1(_from: address) -> bool:

    for i in range(0, 20):

        if self.keys[i] == _from and self.key_types[i] == 1:
            return True

    return False


def addKey(_key: address, _type: num(num256)) -> bool:
    assert _type >= 1
    assert self.key_count <= 20

    if not self.from_key_type1(msg.sender):
        return False

    self.keys[self.key_count] = _key
    self.key_types[self.key_count] = 1
    self.key_count += 1

    return True


def removeKey(_key: address) -> bool:

    if not self.from_key_type1(msg.sender):
        return False

    for i in range(0, 20):

        if i >= self.key_count:
            break

        if self.keys[i] == _key:
            self.keys[i] = 0x0000000000000000000000000000000000000000
            return True

    return False


def replaceKey(_oldKey: address, _newKey: address) -> bool:

    if not self.from_key_type1(msg.sender):
        return False

    for i in range(0, 20):

        if i >= self.key_count:
            break

        if self.keys[i] == _oldKey:
            self.keys[i] = _newKey
            return True

    return False


# The signature format is a compact form of:
#     {bytes32 r}{bytes32 s}{uint8 v}
# Compact means, uint8 is not padded to 32 bytes.
# @internal
def sig_verify(h: bytes32, signer: address, sig: bytes <= 66) -> bool:
    r = extract32(sig, 0, type=num256)
    s = extract32(sig, 32, type=num256)
    sliced = slice(sig, start=64, len=1)
    v = bytes_to_num(sliced)

    # geth uses [0, 1] and some clients have followed.
    # Add 27 to make it v compatible.
    if v < 27:
        v += 27
    assert v == 27 or v == 28

    if ecrecover(h, as_num256(v), r, s) == signer:
        return True
    else:
        return False


def addClaim(_claimType: num(num256), issuer: address, signatureType: num(num256),
             _signature: bytes <= 4096, _data: bytes <= 4096, _uri: bytes <= 4096) -> bytes32:

    # NOTE: For the time being assume singatureType == 1 means use ecrecover to verify.
    # Also we only allow EC verify in this contract.

    assert signatureType == 1
    assert issuer == msg.sender

    claim_data = concat(as_bytes32(self), as_bytes32(_claimType), _data)
    claim_hash = sha3(claim_data)

    if self.sig_verify(claim_hash, issuer, slice(_signature, start=0, len=66)):
        _id = sha3(concat(claim_hash, as_bytes32(block.timestamp)))
        self.claims[self.claim_count] = {
            claimId: _id,
            claimType: _claimType,
            issuer: issuer,
            signatureType: signatureType,
            signature: _signature,
            data: _data,
            uri: _uri
        }
        self.claim_count += 1
        return _id
    else:
        throw


def getClaim(_claimId: bytes32) -> (num256, address, num256, bytes <= 4096, bytes <= 4096, bytes <= 4096):

    for i in range(0, 20):
        if i >= self.claim_count:
            break

        if _claimId == self.claims[i].claimId:
            c = self.claims[i]
            return c.claimType, c.issuer, c.signatureType, c.signature, c.data, c.uri


# Outstanding:
# function getClaimIdsByType(uint256 _claimType) constant returns(bytes32[] claimIds);
# function removeClaim(bytes32 _claimId) returns (bool success)

# function addClaim(uint256 _claimType, address issuer, uint256 signatureType,
#                   bytes _signature, bytes _data, string _uri) returns (bytes32 claimRequestId)

# Events:
# all
