
keys: address[20]
key_types: num[20]
key_count: num


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

    self.key_count += 1
    self.keys[self.key_count] = _key
    self.key_types[self.key_count] = 1

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
