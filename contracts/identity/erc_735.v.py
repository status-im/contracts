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


def getClaimIdsByType(_claimType: num(num256)) -> bytes32[20]:

    outarr: bytes32[20]

    j = 0
    for i in range(0, 20):
        if i >= self.claim_count:
            break

        if self.claims[i].claimType == _claimType:
            outarr[j] = self.claims[i].claimId
            j += 1

    return outarr

# Outstanding:
# function getClaimIdsByType(uint256 _claimType) constant returns(bytes32[] claimIds);
# function removeClaim(bytes32 _claimId) returns (bool success)

# function addClaim(uint256 _claimType, address issuer, uint256 signatureType,
#                   bytes _signature, bytes _data, string _uri) returns (bytes32 claimRequestId)

# Events:
# all
