pragma solidity ^0.4.17;


/// @title Multisignature wallet - Allows multiple parties to agree on transactions before execution.
/// @author Stefan George - <stefan.george@consensys.net> & Ricardo Guilherme Schmidt <ricardo3@status.im>
contract MultiSig {

    uint constant public MAX_OWNER_COUNT = 50;

    event Confirmation(address indexed sender, uint indexed transactionId);
    event Revocation(address indexed sender, uint indexed transactionId);
    event Submission(uint indexed transactionId);
    event Execution(uint indexed transactionId);
    event ExecutionFailure(uint indexed transactionId);

    mapping (uint => Transaction) public transactions;
    mapping (uint => mapping (address => bool)) public confirmations;
    mapping (address => bool) public isOwner;
    address[] public owners;
    uint public required;
    uint public transactionCount;

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
    }


    /*
     *  Modifiers
     */
    modifier onlyMultiSig() {
        require(msg.sender == address(this));
        _;
    }

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner]);
        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner]);
        _;
    }

    modifier transactionExists(uint transactionId) {
        require(transactions[transactionId].destination != 0);
        _;
    }

    modifier confirmed(uint transactionId, address owner) {
        require(confirmations[transactionId][owner]);
        _;
    }

    modifier notConfirmed(uint transactionId, address owner) {
        require(!confirmations[transactionId][owner]);
        _;
    }

    modifier notExecuted(uint transactionId) {
        require(!transactions[transactionId].executed);
        _;
    }

    modifier notNull(address _address) {
        require(_address != 0);
        _;
    }

    modifier validRequirement(uint ownerCount, uint _required) {
        require(ownerCount <= MAX_OWNER_COUNT && _required <= ownerCount && _required != 0 && ownerCount != 0);
        _;
}
    /*
     * Public functions
     */
    /// @dev Contract constructor sets initial owners and required number of confirmations.
    /// @param _owners List of initial owners.
    /// @param _required Number of required confirmations.
    function MultiSig(address[] _owners, uint _required)
        public
        validRequirement(_owners.length, _required)
    {
        for (uint i = 0; i < _owners.length; i++) {
            require (!isOwner[_owners[i]] && _owners[i] != address(0));
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }

   
    /// @dev Allows an owner to submit and confirm a transaction.
    /// @param _destination Transaction target address.
    /// @param _value Transaction ether value.
    /// @param _data Transaction data payload.
    /// @return Returns transaction ID.
    function submitTransaction(address _destination, uint _value, bytes _data)
        external
        returns (uint transactionId)
    {
        return submitTransaction(msg.sender, _destination, _value, _data);
    }

    /// @dev Allows an owner to confirm a transaction.
    /// @param _transactionId Transaction ID.
    function confirmTransaction(uint _transactionId)
        external
    {
        confirmTransaction(msg.sender, _transactionId);
    }


    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param _transactionId Transaction ID.
    function revokeConfirmation(uint _transactionId) 
        external
    {
        revokeConfirmation(msg.sender, _transactionId);
    }


    /// @dev Allows anyone to execute a confirmed transaction.
    /// @param _transactionId Transaction ID.
    function executeTransaction(uint _transactionId)
        public
        notExecuted(_transactionId)
    {
        if (isConfirmed(_transactionId)) {
            Transaction storage txn = transactions[_transactionId];
            txn.executed = true;
            if (txn.destination.call.value(txn.value)(txn.data))
                Execution(_transactionId);
            else {
                ExecutionFailure(_transactionId);
                txn.executed = false;
            }
        }
    }

    /// @dev Returns the confirmation status of a transaction.
    /// @param _transactionId Transaction ID.
    /// @return Confirmation status.
    function isConfirmed(uint _transactionId)
        public
        constant
        returns (bool)
    {
        uint count = 0;
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                count += 1;
            }
            if (count == required) {
                return true;
            }
        }
    }


    /*
     * Web3 call functions
     */
    /// @dev Returns number of confirmations of a transaction.
    /// @param _transactionId Transaction ID.
    /// @return Number of confirmations.
    function getConfirmationCount(uint _transactionId)
        public
        constant
        returns (uint count)
    {
        for (uint i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                count += 1;
            }
        }
    }

    /// @dev Returns total number of transactions after filers are applied.
    /// @param _pending Include pending transactions.
    /// @param _executed Include executed transactions.
    /// @return Total number of transactions after filters are applied.
    function getTransactionCount(bool _pending, bool _executed)
        public
        constant
        returns (uint count)
    {
        for (uint i = 0; i < transactionCount; i++) {
            if (_pending && !transactions[i].executed || _executed && transactions[i].executed) {
                count += 1;
            }
        }
    }

    /// @dev Returns list of owners.
    /// @return List of owner addresses.
    function getOwners()
        public
        constant
        returns (address[])
    {
        return owners;
    }

    /// @dev Returns array with owner addresses, which confirmed transaction.
    /// @param _transactionId Transaction ID.
    /// @return Returns array of owner addresses.
    function getConfirmations(uint _transactionId)
        public
        constant
        returns (address[] _confirmations)
    {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint count = 0;
        uint i;
        for (i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count += 1;
            }
        }    
        _confirmations = new address[](count);
        for (i = 0; i < count; i++) {
            _confirmations[i] = confirmationsTemp[i];
        }
    }

    /// @dev Returns list of transaction IDs in defined range.
    /// @param _from Index start position of transaction array.
    /// @param _to Index end position of transaction array.
    /// @param _pending Include pending transactions.
    /// @param _executed Include executed transactions.
    /// @return Returns array of transaction IDs.
    function getTransactionIds(uint _from, uint _to, bool _pending, bool _executed)
        public
        constant
        returns (uint[] transactionIds)
    {
        uint[] memory transactionIdsTemp = new uint[](transactionCount);
        uint count = 0;
        uint i;
        for (i = 0; i < transactionCount; i++) {
            if (_pending && !transactions[i].executed || _executed && transactions[i].executed) {
                transactionIdsTemp[count] = i;
                count += 1;
            }
        }
        transactionIds = new uint[](_to - _from);
        for (i = _from; i < _to; i++) {
            transactionIds[i - _from] = transactionIdsTemp[i];
        }
    }

    /*
     * Internal functions
     */

    /// @dev Allows an owner to submit and confirm a transaction.
    /// @param _destination Transaction target address.
    /// @param _value Transaction ether value.
    /// @param _data Transaction data payload.
    /// @return Returns transaction ID.
    function submitTransaction(address _from, address _destination, uint _value, bytes _data)
        internal
        returns (uint transactionId)
    {
        transactionId = addTransaction(_destination, _value, _data);
        confirmTransaction(_from, transactionId);
    }

    /// @dev Adds a new transaction to the transaction mapping, if transaction does not exist yet.
    /// @param _destination Transaction target address.
    /// @param _value Transaction ether value.
    /// @param _data Transaction data payload.
    /// @return Returns transaction ID.
    function addTransaction(address _destination, uint _value, bytes _data)
        internal
        notNull(_destination)
        returns (uint transactionId)
    {
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            destination: _destination,
            value: _value,
            data: _data,
            executed: false
        });
        transactionCount += 1;
        Submission(transactionId);
    }

    /// @dev Allows an owner to confirm a transaction.
    /// @param _transactionId Transaction ID.
    function confirmTransaction(address _from, uint _transactionId)
        internal
        ownerExists(_from)
        transactionExists(_transactionId)
        notConfirmed(_transactionId, _from)
    {
        confirmations[_transactionId][_from] = true;
        Confirmation(_from, _transactionId);
        executeTransaction(_transactionId);
    }

    /// @dev Allows an owner to revoke a confirmation for a transaction.
    /// @param _transactionId Transaction ID.
    function revokeConfirmation(address _from, uint _transactionId)
        internal
        ownerExists(_from)
        confirmed(_transactionId, _from)
        notExecuted(_transactionId)
    {
        confirmations[_transactionId][_from] = false;
        Revocation(_from, _transactionId);
    }

}

