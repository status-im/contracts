pragma solidity ^0.4.17;

import "../token/ERC20Token.sol";
import "../util/EmojiTable.sol";
import "../democracy/FeeRecycler.sol";

/**
 * @title EmojiBoard
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Enables users recycling fees upon sending public emojis to addresses, causing a loose reputation board
 */
contract EmojiBoard {

    EmojiTable public emojiTable;
    FeeRecycler public feeRecycler;
    mapping (address => EmojiMessage[]) public received;
    mapping (bytes32 => uint256) emojiRating;

    struct EmojiMessage {
        address sender;
        uint256 value;
        uint32[] emojis;
    }

    /**
     * @notice Construct the EmojiBoard defining it's dependencies
     * @param _feeRecycler Contract that store recyclable fees
     * @param _emojiTable Contract that contain recognized unicode emoji ranges
     */
    function EmojiBoard(FeeRecycler _feeRecycler, EmojiTable _emojiTable) public {
        feeRecycler = _feeRecycler;
        emojiTable = _emojiTable;
    }

    /**
     * @notice `msg.sender` writes a 5 emoji sequence to the board
     * @param _to whoever is getting the emojis
     * @param _value the value of 5 emojis being added
     * @param _emojiUnicode unicode values array represeting emoji sequence
     * @param _emojiType positions array of the emojis allowed ranges in `emojiTable`
     */
    function write(
        address _to,
        uint256 _value,
        uint32[] _emojiUnicode,
        uint256[] _emojiType
    )
        external
    {
        write(
            msg.sender,
            _to,
            _value,
            _emojiUnicode,
            _emojiType
            );
    }

    /**
     * @dev `_from` writes a 5 emoji sequence to the board
     * @param _from whoever is writing the emojis
     * @param _to whoever is getting the emojis
     * @param _value the value of 5 emojis being added
     * @param _emojiUnicode unicode values array represeting emoji sequence
     * @param _emojiType positions array of the emojis allowed ranges in `emojiTable`
     */
    function write(
        address _from,
        address _to,
        uint256 _value,
        uint32[] _emojiUnicode,
        uint256[] _emojiType
    )
        internal
    {
        uint len = _emojiUnicode.length;
        require(_value > 0);
        require(len == 5);
        require(emojiTable.isEmojiOnly(_emojiUnicode, _emojiType));
        ERC20Token token = ERC20Token(feeRecycler.token());
        require(token.transferFrom(_from, address(this), _value));
        token.approve(feeRecycler, _value);
        feeRecycler.collectFrom(_from, _value);
        
        for (uint i; i < len; i++) {
            emojiRating[keccak256(_to,_emojiUnicode[i])] += _value; //divided by len? safeadd?
        }

        received[_to].push(EmojiMessage(_from, _value, _emojiUnicode));
    }
}