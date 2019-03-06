pragma solidity >=0.5.0 <0.6.0;

import "../common/Controlled.sol";

/**
 * @notice Linked list which requires entries being linked in points descending order, from head to tai* @author Ricardo Guilherme Schmidt
 */
contract Ranking is Controlled {
    event EntryOwned(bytes32 indexed uid, address indexed owner);
    event EntryValueChange(bytes32 indexed uid, uint256 newValue);
    struct Entry {
        uint256 timestamp;
        address owner;
        uint256 points;
        bytes32 next;
        bytes32 previous;
    }

    bytes32 public top;
    mapping (bytes32 => Entry) public entries;

    function include(bytes32 _uid, address _owner, uint256 _points, bytes32 _before) external onlyController {
        require(_uid != bytes32(0), "Reserved uid");
        require(entries[_uid].timestamp == uint256(0), "Duplicate");
        bytes32 next;
        if(_before == bytes32(0)){
            if(top != bytes32(0)){
                require(entries[top].points < _points, "Not top position"); 
                next = top;
            }
            top = _uid;
            
        } else {
            Entry storage beforeObj = entries[_before];
            require(beforeObj.timestamp != uint256(0), "Unexistent _before");
            require(beforeObj.points >= _points, "Wrong _before");
            next = beforeObj.next; //save next element
            beforeObj.next = _uid; //replace next element
        }
        if(next != bytes32(0)){
            Entry storage nextObj = entries[next];
            require(nextObj.points < _points, "Wrong _before's next");
            nextObj.previous = _uid;
        }
        entries[_uid] = Entry(block.timestamp, _owner, _points, next, _before);
        emit EntryOwned(_uid, _owner);
        emit EntryValueChange(_uid, _points);
    }

    function increase(bytes32 _uid, uint256 _points, bytes32 _newPrevious) external onlyController {
        uint256 oldValue = entries[_uid].points;
        move(_uid, _newPrevious, oldValue + _points);
    }

    function decrease(bytes32 _uid, uint256 _points, bytes32 _newPrevious) external onlyController {
        uint256 oldValue = entries[_uid].points;
        require(oldValue >= _points, "Bad points");
        uint256 newValue = oldValue - _points;
        if(newValue > 0) {
            move(_uid, _newPrevious, newValue);
        } else {
            require(_newPrevious == bytes32(0), "Bad argument");
            exclude(_uid);
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

    function previousOf(bytes32 _uid) external view returns (bytes32) {
        return entries[_uid].previous;
    }
    
    function timestampOf(bytes32 _uid) external view returns (uint256) {
        return entries[_uid].timestamp;
    }

    function move(bytes32 _uid, bytes32 _newPrevious, uint256 _newValue) private {
        bytes32 newNext;
        Entry storage moving = entries[_uid];
        bytes32 _oldNext = moving.next;
        bytes32 _oldPrevious = moving.previous;
        require(moving.timestamp != 0, "Unknown uid");
        if(_oldPrevious != bytes32(0)){
            Entry storage oldBefore = entries[_oldPrevious];
            require(oldBefore.timestamp != 0, "Unknown oldPrevious");
            require(oldBefore.next == _uid, "Invalid oldPrevious");
            oldBefore.next = _oldNext;
        } else {
            top = _oldNext;
        }

        if(_oldNext != bytes32(0)) {  
            entries[_oldNext].previous = _oldPrevious;
        }
         
        if(_newPrevious != bytes32(0)) {
            Entry storage newBefore = entries[_newPrevious];
            require(newBefore.timestamp != 0, "Unknown newPrevious");
            newNext = newBefore.next;
            if(newBefore.points == _newValue){
                require(newBefore.timestamp < moving.timestamp, "Low newPrevious timestamp");
            } else {
                require(newBefore.points >= _newValue, "Low newPrevious points");
            }
            
            newBefore.next = _uid;
        } else {
            newNext = top;
            top = _uid;
        }
        if(newNext != bytes32(0)){
            Entry storage newNextObj = entries[newNext];
            if(newNextObj.points == _newValue){
                require(newNextObj.timestamp > moving.timestamp, "High newNext timestamp");
            } else {
                require(newNextObj.points < _newValue, "High newNext points");
            }
            newNextObj.previous = _uid;
        }
        moving.next = newNext;
        moving.previous = _newPrevious;
        moving.points = _newValue;
        emit EntryValueChange(_uid, _newValue);
    }

    function exclude(bytes32 _uid) private {
        Entry memory excluded = entries[_uid];
        require(excluded.timestamp != 0, "Unknown uid");
        bytes32 _oldPrevious = excluded.previous;
        bytes32 _oldNext = excluded.next;
        if(_oldNext != bytes32(0)) {
            entries[_oldNext].previous = _oldPrevious;
        }
        if(_oldPrevious != bytes32(0)){
            entries[_oldPrevious].next = _oldNext;
        } else {
            require(top == _uid, "Bad argument");
            top = _oldNext;
        }
        delete entries[_uid];

    }
}
