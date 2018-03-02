pragma solidity ^0.4.17; 

import "../common/Controlled.sol";

contract EmojiCheck is Controlled {

    struct Range {
        uint32 start;
        uint32 end;
    }

    Range[] ranges;

    function addEmojiRange(
        uint32 _start,
        uint32 _end
    ) 
        external 
        onlyController 
    {
        ranges.push(Range(_start,_end));
    }

    function updateEmojiRange(
        uint256 _rangePos,
        uint32 _start,
        uint32 _end
    ) 
        external 
        onlyController 
    {
        require(_rangePos < ranges.length);
        ranges[_rangePos] = Range(_start,_end);
    }

    function isInEmojiRange(
        uint32 _char,
        uint256 _rangePos
    )
        public
        view 
        returns(bool)
    {
        require(_char != 0);
        Range memory range = ranges[_rangePos];
        return (_char >= range.start && _char <= range.end);
    }

    function isEmojiOnly(
        uint32[] _s,
        uint256[] _rangePos
    )
        public
        constant
        returns(bool)
    {
        uint len = _s.length;
        require(_rangePos.length == len);
        for (uint i = 0; i < len; i++) {
            if (!isInEmojiRange(_s[i], _rangePos[i])) {
                return false;
            }
        }
        return true;
    }
    
}