pragma solidity >=0.5.0 <0.6.0;
import "./AccountGasAbstract.sol";
import "../cryptography/ECDSA.sol";
/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 */
contract MultisigAccount is AccountGasAbstract {
    uint256 available = 0;
    uint256 required = 0;
    mapping(address => bool) isKey;

    modifier self {
        require(msg.sender == address(this), "Unauthorized");
        _;
    }

    constructor(address[] _keys, uint256 _required) public {
        available = _keys.length;
        required = _required;
        for(uint i = 0; i < _keys; i++) {
            address key = _keys[i];
            require(isKey[key] == false, "Duplicated");
            isKey[key] = true;
        }
    }

    function execute(address _to, uint256 _value, bytes calldata _data, bytes calldata _signature) external {
        require(isValidSignature(abi.encodePacked(address(this),nonce,_to,_value,_data),_signature) == MAGICVALUE, ERR_BAD_SIGNER);
        _execute(_to, _value, _data);
    }

    function setKey(address key, bool isValid) external self {
        require(isKey[key] != isValid, "Already set");
        isKey[key] = isValid;
        isValid ? available++ : available--;
        require(available >= required, "Reduce required first");
    }

    function setRequired(uint256 _required) external self {
        require(available >= _required, "No enough keys");
        required = _required;
    }

    function isValidSignature(
        bytes memory _data,
        bytes memory _signature
    )
        public
        view
        returns (bytes4 magicValue)
    {
        uint _amountSignatures = _signature.length / 65;
        if(_amountSignatures != required) {
            return 0x00000000;
        }

        address lastSigner = address(0);
        uint8 v;
        bytes32 r;
        bytes32 s;
        bytes32 dataHash = ECDSA.toERC191SignedMessage(0x00, _data);
        for (uint256 i = 0; i < _amountSignatures; i++) {
            /* solium-disable-next-line security/no-inline-assembly*/
            assembly {
                let signaturePos := mul(0x41, i)
                r := mload(add(_signature, add(signaturePos, 0x20)))
                s := mload(add(_signature, add(signaturePos, 0x40)))
                v := and(mload(add(_signature, add(signaturePos, 0x41))), 0xff)
            }
            address signer = ecrecover(dataHash, v, r, s);
            if (signer <= lastSigner || !isKey[signer] ) {
                return 0x00000000;
            }

            lastSigner = signer;
        }
        magicValue = MAGICVALUE;
    }

}