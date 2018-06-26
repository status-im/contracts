pragma solidity ^0.4.6;

/*
    Copyright 2016, Jordi Baylina

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import "../common/Controlled.sol";
import "./RLP.sol";

contract SingleChoice is Controlled {
    using RLP for RLP.RLPItem;
    using RLP for RLP.Iterator;
    using RLP for bytes;

    string public question;
    string[] public choices;
    int[] public result;
    bytes32 uid;

    function SingleChoice(address _controller, bytes _rlpDefinition, uint salt) {

        uid = keccak256(block.blockhash(block.number-1), salt);
        controller = _controller;

        var itmPoll = _rlpDefinition.toRLPItem(true);

        if (!itmPoll.isList()) throw;

        var itrPoll = itmPoll.iterator();

        question = itrPoll.next().toAscii();

        var itmOptions = itrPoll.next();

        if (!itmOptions.isList()) throw;

        var itrOptions  = itmOptions.iterator();

        while(itrOptions.hasNext()) {
            choices.length++;
            choices[choices.length-1] = itrOptions.next().toAscii();
        }

        result.length = choices.length; 
    }

    function pollType() public constant returns (bytes32) {
        return bytes32("SINGLE_CHOICE");
    }

    function isValid(bytes32 _ballot) constant returns(bool) {
        uint v = uint(_ballot) / (2**248);
        if (v>=choices.length) return false;
        if (getBallot(v) != _ballot) return false;
        return true;
    }

    function deltaVote(int _amount, bytes32 _ballot) onlyController returns (bool _succes) {
        if (!isValid(_ballot)) return false;
        uint v = uint(_ballot) / (2**248);
        result[v] += _amount;
        return true;
    }

    function nOptions() constant returns(uint) {
        return choices.length;
    }

    function getBallot(uint _option) constant returns(bytes32) {
        return bytes32((_option * (2**248)) + (uint(keccak256(uid, _option)) & (2**248 -1)));
    }
}



