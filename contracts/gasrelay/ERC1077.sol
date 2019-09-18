pragma solidity >=0.5.0 <0.6.0;


contract ERC1077 {
    enum OperationType {CALL, DELEGATECALL, CREATE}

    event ExecutedSigned(bytes32 indexed messageHash, uint indexed nonce, bool indexed success);

    function canExecute(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        OperationType operationType,
        bytes memory signatures) public view returns (bool);

    function executeSigned(
        address to,
        uint256 value,
        bytes memory data,
        uint nonce,
        uint gasPrice,
        address gasToken,
        uint gasLimit,
        OperationType operationType,
        bytes memory signatures) public returns (bytes32);


    function getSignHash(
        address _to,
        uint256 _value,
        bytes32 _dataHash,
        uint _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        address _gasToken,
        uint8 _callPrefix,
        uint8 _operationType,
        bytes memory _extraHash
    ) public view returns (bytes32){
        return keccak256(
            abi.encodePacked(
                byte(0x19),
                byte(0),
                address(this),
                _to,
                _value,
                _dataHash,
                _nonce,
                _gasPrice,
                _gasLimit,
                _gasToken,
                _callPrefix,
                _operationType,
                _extraHash
            ));

    }
}