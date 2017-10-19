# Events of the identiy contract.
KeyAdded: __log__({key: indexed(address), type: indexed(num256)})
KeyRemoved: __log__({key: indexed(address), type: indexed(num256)})
ExecutionRequested: __log__({executionId: indexed(num256), to: indexed(address), value: indexed(num256), data: bytes <= 4096})
Executed: __log__({executionId: indexed(num256), to: indexed(address), value: indexed(num256), data: bytes <= 4096})


# Key management types
keys: address[20]
key_types: num[20]
key_count: num
execute_list: {
    to: address,
    data: bytes <= 8128,
    value: num,
    approved: bool
}[num]
execute_count: num


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


def execute(_to: address, _value: num(num256), _data: bytes <= 8128) -> num256:
    self.execute_list[self.execute_count] = {
        to: _to,
        value: _value,
        data: _data,
        approved: False
    }

    log.ExecutionRequested(as_num256(self.execute_count), _to, as_num256(_value), _data)
    self.execute_count += 1
    return as_num256(0)


def approve(executeId: num(num256)) -> bool:

    if not (self.from_key_type(msg.sender, 1) or self.from_key_type(msg.sender, 4)):
        return False

    e = self.execute_list[executeId]
    e.approved = True
    # execute action.

    # log.Approved(executionId, e._to, e._value, e._data)

    return True

# function execute(address _to, uint256 _value, bytes _data) returns (uint256 executionId)
# function approve(uint256 _id, bool _approve) returns (bool success)

# ({executionId: indexed(num256), to: indexed(address), value: indexed(num256), data: bytes <= 4096}
# {executionId: indexed(num256), to: indexed(address), value: indexed(num256), data: bytes <= 4096}
