# Viper verify ecrecovery function.


owner: address


def __init__():
    self.owner = msg.sender


def sigdata_verify(h: bytes32, sigdata: num256[3]) -> bool:
    if ecrecover(h, sigdata[0], sigdata[1], sigdata[2]) == self.owner:
        return True
    else:
        return False


def sig_verify(h: bytes32, sig: bytes <= 66) -> bool:

    r = extract32(sig, 0, type=num256)
    s = extract32(sig, 32, type=num256)
    sliced = slice(sig, start=64, len=1)
    v = as_num256(bytes_to_num(sliced))

    if ecrecover(h, r, s, v) == self.owner:
        return True
    else:
        return False
