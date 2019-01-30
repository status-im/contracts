pragma solidity >=0.5.0 <0.6.0;

/**
 * @notice Linked list which requires objects being linked in value descending order, from head to tai* @author Ricardo Guilherme Schmidt
 */
contract Ranking {

    struct Object {
        uint256 timestamp;
        address owner;
        uint256 value;
        bytes32 next;
        //bytes32 previous;
    }

    bytes32 top;
    mapping (bytes32 => Object) object;

    function include(bytes32 _uid, uint256 _value, bytes32 _before) external {
        require(object[_uid].timestamp == uint256(0), "Duplicate");
        bytes32 next;
        if(_before == bytes32(0)){
            if(top != bytes32(0)){
                require(object[top].value >= _value, "Not top position");
                next = top;
            }
            top = _uid;
        } else {
            require(object[_before].value >= _value, "Bad position");
            next = object[_before].next;
            require(object[next].value <= _value, "Bad position 2");
            object[_before].next = _uid;
        }
        object[_uid] = Object(block.timestamp, msg.sender, _value, next);
    }

    function increase(bytes32 _uid, bytes32 _oldPrevious, bytes32 _newPrevious, uint256 _value) external {
        uint256 oldValue = object[_uid].value;
        move(_uid, _oldPrevious, _newPrevious, oldValue + _value);
    }

    function decline(bytes32 _uid, bytes32 _oldPrevious, bytes32 _newPrevious, uint256 _value) external {
        uint256 oldValue = object[_uid].value;
        require(oldValue >= _value,"Bad value");
        uint256 newValue = oldValue - _value;
        if(newValue > 0) {
            move(_uid, _oldPrevious, _newPrevious, newValue);
        } else {
            require(_newPrevious == bytes32(0), "Bad argument");
            exclude(_uid, _oldPrevious);
        }
        
    }

    function move(bytes32 _uid, bytes32 _oldPrevious, bytes32 _newPrevious, uint256 _newValue) private {
        bytes32 newNext;
        Object storage moving = object[_uid];
        require(moving.timestamp != 0, "Unknown uid");
        if(_oldPrevious != bytes32(0)){
            Object storage oldBefore = object[_oldPrevious];
            require(oldBefore.timestamp != 0, "Unknown oldPrevious");
            require(oldBefore.next == _uid, "Invalid oldPrevious");
            oldBefore.next = moving.next;
        } else {
            require(top == _uid, "Bad argument");
        }
         
        if(_newPrevious != bytes32(0)){
            Object storage newBefore = object[_newPrevious];
            require(newBefore.timestamp != 0, "Unknown newPrevious");
            newNext = newBefore.next;
            Object memory newNextObj = object[newBefore.next];

            if(newBefore.value == _newValue){
                require(newBefore.timestamp < moving.timestamp, "Low newPrevious value");
            } else {
                require(newBefore.value >= _newValue, "Low newPrevious value");
            }
            if(newNext != bytes32(0)){
                if(newNextObj.value == _newValue){
                    require(newNextObj.timestamp > moving.timestamp, "High newNext value");
                } else {
                    require(newNextObj.value < _newValue, "High newNext value");
                }
            }
            newBefore.next = _uid;
        } else {
            newNext = top;
            top = _uid;
        }
        moving.next = newNext;
        moving.value = _newValue;
        
    }

    function exclude(bytes32 _uid, bytes32 _oldPrevious) private {
        Object memory excluded = object[_uid];
        require(excluded.timestamp != 0, "Unknown uid");
        if(_oldPrevious != bytes32(0)){
            Object storage oldBefore = object[_oldPrevious];
            require(oldBefore.timestamp != 0, "Unknown oldPrevious");
            require(oldBefore.next == _uid, "Invalid oldPrevious");
            oldBefore.next = excluded.next;
        } else {
            require(top == _uid, "Bad argument");
            top = excluded.next;
        }
        delete object[_uid];

    }
}
