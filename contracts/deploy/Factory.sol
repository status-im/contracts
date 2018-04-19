pragma solidity ^0.4.17;

import "../common/Controlled.sol";

contract Factory is Controlled {

    event NewKernel(address newKernel, bytes32 codeHash);

    struct Version {
        uint256 blockNumber;
        uint256 timestamp;
        address kernel;
        bytes32 codeHash;
    }

    mapping (address => uint256) versionMap;

    Version[] versionLog;
    uint256 latestUpdate;
    address latestKernel;

    function Factory(address _kernel)
        public 
    {
        _setKernel(_kernel);
    }

    function setKernel(address _kernel)
        external 
        onlyController
    {
        _setKernel(_kernel);
    }

    function getVersion(uint256 index)
        public
        view
        returns(
            uint256 blockNumber,
            uint256 timestamp,
            address kernel,
            bytes32 codeHash
        )
    {
        return (
            versionLog[index].blockNumber, 
            versionLog[index].timestamp, 
            versionLog[index].kernel, 
            versionLog[index].codeHash
        );
    }

    function getCodeHash(address _addr) 
        public 
        view 
        returns (bytes32 codeHash) 
    {
        bytes memory o_code;
        uint size;
        assembly {
            // retrieve the size of the code, this needs assembly
            size := extcodesize(_addr)
        }
        require (size > 0);
        assembly {
            // allocate output byte array - this could also be done without assembly
            // by using o_code = new bytes(size)
            o_code := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(o_code, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(_addr, add(o_code, 0x20), 0, size)
        }
        codeHash = keccak256(o_code);
    }

    function _setKernel(address _kernel) 
        internal
    {
        require(_kernel != latestKernel);
        bytes32 _codeHash = getCodeHash(_kernel);
        versionMap[_kernel] = versionLog.length;
        versionLog.push(Version({blockNumber: block.number, timestamp: block.timestamp, kernel: _kernel, codeHash: _codeHash}));
        latestUpdate = block.timestamp;
        latestKernel = _kernel;
        emit NewKernel(_kernel, _codeHash);
    }
}