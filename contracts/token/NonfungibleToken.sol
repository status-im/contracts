pragma solidity >=0.5.0 <0.6.0;

import "./ERC721.sol";
import "./ERC721Receiver.sol";
import "../common/SafeMath.sol";
import "../common/Address.sol";
import "../common/Introspective.sol";

/**
 * @title ERC721 Non-Fungible Token Standard basic implementation
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract NonfungibleToken is Introspective, ERC721 {
    using SafeMath for uint256;
    using Address for address;

    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    // which can be also obtained as `ERC721Receiver(0).onERC721Received.selector`
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    // Mapping from token ID to owner
    mapping (uint256 => address) private _tokenOwner;

    // Mapping from token ID to approved address
    mapping (uint256 => address) private _tokenApprovals;

    // Mapping from owner to number of owned token
    mapping (address => uint256) private _ownedTokensCount;

    // Cache view of user token list
    mapping (address => uint256[]) private _ownedTokens;
    mapping (uint256 => uint256) private _ownedTokensPos;

    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) private _operatorApprovals;

    bytes4 private constant _InterfaceId_ERC721 = 0x80ac58cd;
    /*
     * 0x80ac58cd ===
     *     bytes4(keccak256('balanceOf(address)')) ^
     *     bytes4(keccak256('ownerOf(uint256)')) ^
     *     bytes4(keccak256('approve(address,uint256)')) ^
     *     bytes4(keccak256('getApproved(uint256)')) ^
     *     bytes4(keccak256('setApprovalForAll(address,bool)')) ^
     *     bytes4(keccak256('isApprovedForAll(address,address)')) ^
     *     bytes4(keccak256('transferFrom(address,address,uint256)')) ^
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256)')) ^
     *     bytes4(keccak256('safeTransferFrom(address,address,uint256,bytes)'))
     */

    modifier approvedOrOwner(uint256 tokenId){
        address spender = msg.sender;
        address owner = getOwner(tokenId);
        // Disable solium check because of
        // https://github.com/duaraghav8/Solium/issues/175
        // solium-disable-next-line operator-whitespace
        require(spender == owner || _tokenApprovals[tokenId] == spender || _operatorApprovals[owner][spender], "Unauthorized");
        _;
    }

    modifier safe(address from, address to, uint256 tokenId, bytes memory _data) {
        _;
        if (to.isContract()) {
            bytes4 retval = ERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, _data);
            require(retval == _ERC721_RECEIVED, "Bad operation");
        }
    }


    constructor () public {
        // register the supported interfaces to conform to ERC721 via ERC165
        _registerInterface(_InterfaceId_ERC721);
    }

    /**
     * @dev Gets the balance of the specified address
     * @param owner address to query the balance of
     * @return uint256 representing the amount owned by the passed address
     */
    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Bad address");
        return _ownedTokensCount[owner];
    }

    /**
     * @dev Gets the owner of the specified token ID
     * @param tokenId uint256 ID of the token to query the owner of
     * @return owner address currently marked as the owner of the given token ID
     */
    function ownerOf(uint256 tokenId) external view returns (address) {
        return getOwner(tokenId);
    }

    /**
     * @dev Approves another address to transfer the given token ID
     * The zero address indicates there is no approved address.
     * There can only be one approved address per token at a given time.
     * Can only be called by the token owner or an approved operator.
     * @param to address to be approved for the given token ID
     * @param tokenId uint256 ID of the token to be approved
     */
    function approve(address to, uint256 tokenId) external {
        address owner = getOwner(tokenId);
        require(to != owner, "Bad operation");
        require(msg.sender == owner || _operatorApprovals[owner][msg.sender], "Unauthorized");

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

   
    /**
     * @dev Gets the approved address for a token ID, or zero if no address set
     * Reverts if the token ID does not exist.
     * @param tokenId uint256 ID of the token to query the approval of
     * @return address currently approved for the given token ID
     */
    function getApproved(uint256 tokenId) external view returns (address) {
        require(exists(tokenId), "Bad token");
        return _tokenApprovals[tokenId];
    }

    /**
     * @dev Sets or unsets the approval of a given operator
     * An operator is allowed to transfer all tokens of the sender on their behalf
     * @param to operator address to set the approval
     * @param approved representing the status of the approval to be set
     */
    function setApprovalForAll(address to, bool approved) external {
        require(to != msg.sender, "Bad operation");
        _operatorApprovals[msg.sender][to] = approved;
        emit ApprovalForAll(msg.sender, to, approved);
    }

    /**
     * @dev Tells whether an operator is approved by a given owner
     * @param owner owner address which you want to query the approval of
     * @param operator operator address which you want to query the approval of
     * @return bool whether the given operator is approved by the given owner
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev Transfers the ownership of a given token ID to another address
     * Usage of this method is discouraged, use `safeTransferFrom` whenever possible
     * Requires the msg sender to be the owner, approved, or operator
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
    */
    function transferFrom(address from, address to, uint256 tokenId) external approvedOrOwner(tokenId) {
        transfer(from, to, tokenId);
    }

    /**
     * @dev Safely transfers the ownership of a given token ID to another address
     * If the target address is a contract, it must implement `onERC721Received`,
     * which is called upon a safe transfer, and return the magic value
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`; otherwise,
     * the transfer is reverted.
     *
     * Requires the msg sender to be the owner, approved, or operator
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
    */
    function safeTransferFrom(address from, address to, uint256 tokenId) 
        external 
        approvedOrOwner(tokenId)
        safe(from, to, tokenId, "")    
    {
        transfer(from, to, tokenId);
    }

    /**
     * @dev Safely transfers the ownership of a given token ID to another address
     * If the target address is a contract, it must implement `onERC721Received`,
     * which is called upon a safe transfer, and return the magic value
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`; otherwise,
     * the transfer is reverted.
     * Requires the msg sender to be the owner, approved, or operator
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
     * @param _data bytes data to send along with a safe transfer check
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata _data) 
        external
        approvedOrOwner(tokenId)
        safe(from, to, tokenId, _data) 
    {
        transfer(from, to, tokenId);
    }

    /**
     * @dev Returns whether the specified token exists
     * @param tokenId uint256 ID of the token to query the existence of
     * @return whether the token exists
     */
    function exists(uint256 tokenId) internal view returns (bool) {
        address owner = _tokenOwner[tokenId];
        return owner != address(0);
    }

    /**
     * @dev Internal function to mint a new token
     * Reverts if the given token ID already exists
     * @param to The address that will own the minted token
     * @param tokenId uint256 ID of the token to be minted
     */
    function mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Bad address");
        require(!exists(tokenId), "Bad operation");

        _tokenOwner[tokenId] = to;
        _ownedTokensCount[to] = _ownedTokensCount[to].add(1);
        addOwnedTokens(_ownedTokens[to], tokenId);
        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Internal function to burn a specific token
     * Reverts if the token does not exist
     * Deprecated, use _burn(uint256) instead.
     * @param owner owner of the token to burn
     * @param tokenId uint256 ID of the token being burned
     */
    function burn(address owner, uint256 tokenId) internal {
        require(getOwner(tokenId) == owner, "Unauthorized");

        delete _tokenApprovals[tokenId];

        _ownedTokensCount[owner] = _ownedTokensCount[owner].sub(1);
        _tokenOwner[tokenId] = address(0);
        removeOwnedTokens(_ownedTokens[owner], tokenId);
        emit Transfer(owner, address(0), tokenId);
    }
    
    /**
     * @dev Internal function to burn a specific token
     * Reverts if the token does not exist
     * @param tokenId uint256 ID of the token being burned
     */
    function burn(uint256 tokenId) internal {
        burn(getOwner(tokenId), tokenId);
    }
    /**
     * @dev Internal function to transfer ownership of a given token ID to another address.
     * As opposed to transferFrom, this imposes no restrictions on msg.sender.
     * @param from current owner of the token
     * @param to address to receive the ownership of the given token ID
     * @param tokenId uint256 ID of the token to be transferred
    */
    function transfer(address from, address to, uint256 tokenId) internal {
        require(getOwner(tokenId) == from, "Unauthorized");
        require(to != address(0), "Bad address");

        delete _tokenApprovals[tokenId];
    
        _ownedTokensCount[from] = _ownedTokensCount[from].sub(1);
        _ownedTokensCount[to] = _ownedTokensCount[to].add(1);
        _tokenOwner[tokenId] = to;
        removeOwnedTokens(_ownedTokens[from], tokenId);
        addOwnedTokens(_ownedTokens[to], tokenId);
        emit Transfer(from, to, tokenId);
    }
    
    function addOwnedTokens(uint256[] storage tokenList, uint256 _tokenId) internal {
        _ownedTokensPos[_tokenId] = tokenList.push(_tokenId) + 1;
    }
    
    function removeOwnedTokens(uint256[] storage tokenList, uint256 _tokenId) internal {
        uint pos = _ownedTokensPos[_tokenId];
        if(pos == 0) {
            return;
        }
        uint256 movedElement = tokenList[tokenList.length-1]; //tokenId;
        tokenList[pos-1] = movedElement;
        tokenList.length--;
        _ownedTokensPos[movedElement] = pos;
    }

    function tokensOwnedBy(address owner) external view returns (uint256[] memory tokenList) {
        return _ownedTokens[owner];
    }

   /**
     * @dev Gets the owner of the specified token ID
     * @param tokenId uint256 ID of the token to query the owner of
     * @return owner address currently marked as the owner of the given token ID
     */
    function getOwner(uint256 tokenId) internal view returns (address) {
        address owner = _tokenOwner[tokenId];
        require(owner != address(0), "Bad token");
        return owner;
    }
    
}
