pragma solidity ^0.4.23;

import "./CertifiedIdentity.sol";

contract IdentityCertifier {
    
    mapping (bytes => address[]) addresses;
    mapping (address => bytes) cids;

    event IdentityCreated(address indexed ad, uint256 indexed gas);
    event IdentityRecharged(address indexed ad, uint256 indexed gas);

    modifier hasEnoughBalance {
        require (this.balance > 0);
        _;
    }

    constructor () public {

    }

    /**
     * @notice default function allows deposit of ETH
     */
    function () public payable {}



    /**
     * @notice Managing certified identities
     */
    function createCertifiedIdentity(bytes _cid, bytes32 _address, uint256 _gas) 
    public payable hasEnoughBalance returns (address res)
    {

        // TODO Check if is Payment Oracle calling
        // TODO Check if contract has gas
        bytes32[] memory ads = new bytes32[](1);
        uint256[] memory purps = new uint256[](1);
        uint256[] memory types = new uint256[](1);
        ads[0] = _address;
        purps[0] = 1;
        types[0] = 1;
        CertifiedIdentity contractAddress = new CertifiedIdentity(ads,purps,types,1,1);
        cids[contractAddress] = _cid;
        
        contractAddress.transfer(_gas);

        // TODO push to cids array the new address

        emit IdentityCreated(address(contractAddress), _gas);
        return address(contractAddress);
    }

    function rechargeCertifiedIdentity(address _address, uint32 _gas) public payable
    {
        _address.transfer(_gas);
        emit IdentityCreated(_address, _gas);
    }

    /**
     * Getting informations from contracts
     */

    function getIdentity(address _address) public view returns (bytes cid) {
        return cids[_address];
    }

    function getAddresses(bytes _cid) public view returns (address[] adds) {
        return addresses[_cid];
    }

/** 
    function getIdentityFromContract(address _address) public view returns (bytes cid) {
        Ownable o = Ownable(_address);
        return cids[o.owner()];
    }

    function verifyOwning(address _address, bytes _cid) public view returns (bool res) {
        Ownable o = Ownable(_address);
        return keccak256(cids[o.owner()]) == keccak256(_cid);
    }
*/
}