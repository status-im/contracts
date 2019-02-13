pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";

/**
 * @notice Linked list which requires entries being linked in points descending order, from head to tai* @author Ricardo Guilherme Schmidt
 */
contract Ranking is Controlled {
    event NewEntry(bytes32 indexed uid, address indexed owner);
    event PointsUpdate(bytes32 indexed uid, uint256 newValue);
    struct Entry {
        uint256 timestamp;
        address owner;
        uint256 points;
        bytes32 next;
        //bytes32 previous;
    }

    bytes32 public top;
    mapping (bytes32 => Entry) public entries;

    function include(bytes32 _uid, address _owner, uint256 _points, bytes32 _before) external onlyController {
        require(entries[_uid].timestamp == uint256(0), "Duplicate");
        bytes32 next;
        if(_before == bytes32(0)){
            if(top != bytes32(0)){
                require(entries[top].points >= _points, "Not top position");
                next = top;
            }
            top = _uid;
        } else {
            require(entries[_before].points >= _points, "Bad position");
            next = entries[_before].next;
            require(entries[next].points <= _points, "Bad position 2");
            entries[_before].next = _uid;
        }
        entries[_uid] = Entry(block.timestamp, _owner, _points, next);
        emit NewEntry(_uid, _owner);
        emit PointsUpdate(_uid, _points);
    }

    function increase(bytes32 _uid, uint256 _points, bytes32 _oldPrevious, bytes32 _newPrevious) external onlyController {
        require(entries[_uid].timestamp != uint256(0), "Unknown entry");
        uint256 oldValue = entries[_uid].points;
        move(_uid, _oldPrevious, _newPrevious, oldValue + _points);
    }

    function decrease(bytes32 _uid, uint256 _points, bytes32 _oldPrevious, bytes32 _newPrevious) external onlyController {
        require(entries[_uid].timestamp != uint256(0), "Unknown entry");
        uint256 oldValue = entries[_uid].points;
        require(oldValue >= _points, "Bad points");
        uint256 newValue = oldValue - _points;
        if(newValue > 0) {
            move(_uid, _oldPrevious, _newPrevious, newValue);
        } else {
            require(_newPrevious == bytes32(0), "Bad argument");
            exclude(_uid, _oldPrevious);
        }
        
    }

    function exists(bytes32 _uid) external view returns (bool) {
        return entries[_uid].timestamp != uint256(0);
    }

    function pointsOf(bytes32 _uid) external view returns (uint256) {
        return entries[_uid].points;
    }
    
    function ownerOf(bytes32 _uid) external view returns (address) {
        return entries[_uid].owner;
    }

    function nextOf(bytes32 _uid) external view returns (bytes32) {
        return entries[_uid].next;
    }
    
    function timestampOf(bytes32 _uid) external view returns (uint256) {
        return entries[_uid].timestamp;
    }

    function move(bytes32 _uid, bytes32 _oldPrevious, bytes32 _newPrevious, uint256 _newValue) private {
        bytes32 newNext;
        Entry storage moving = entries[_uid];
        require(moving.timestamp != 0, "Unknown uid");
        if(_oldPrevious != bytes32(0)){
            Entry storage oldBefore = entries[_oldPrevious];
            require(oldBefore.timestamp != 0, "Unknown oldPrevious");
            require(oldBefore.next == _uid, "Invalid oldPrevious");
            oldBefore.next = moving.next;
        } else {
            require(top == _uid, "Bad argument");
        }
         
        if(_newPrevious != bytes32(0)){
            Entry storage newBefore = entries[_newPrevious];
            require(newBefore.timestamp != 0, "Unknown newPrevious");
            newNext = newBefore.next;
            Entry memory newNextObj = entries[newBefore.next];

            if(newBefore.points == _newValue){
                require(newBefore.timestamp < moving.timestamp, "Low newPrevious points");
            } else {
                require(newBefore.points >= _newValue, "Low newPrevious points");
            }
            if(newNext != bytes32(0)){
                if(newNextObj.points == _newValue){
                    require(newNextObj.timestamp > moving.timestamp, "High newNext points");
                } else {
                    require(newNextObj.points < _newValue, "High newNext points");
                }
            }
            newBefore.next = _uid;
        } else {
            newNext = top;
            top = _uid;
        }
        moving.next = newNext;
        moving.points = _newValue;
        emit PointsUpdate(_uid, _newValue);
    }

    function exclude(bytes32 _uid, bytes32 _oldPrevious) private {
        Entry memory excluded = entries[_uid];
        require(excluded.timestamp != 0, "Unknown uid");
        if(_oldPrevious != bytes32(0)){
            Entry storage oldBefore = entries[_oldPrevious];
            require(oldBefore.timestamp != 0, "Unknown oldPrevious");
            require(oldBefore.next == _uid, "Invalid oldPrevious");
            oldBefore.next = excluded.next;
        } else {
            require(top == _uid, "Bad argument");
            top = excluded.next;
        }
        delete entries[_uid];

    }
}
