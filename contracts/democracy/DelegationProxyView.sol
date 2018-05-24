pragma solidity ^0.4.21;

import "./DelegationProxy.sol";


/**
 * @title DelegationProxy
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @dev Creates a delegation proxy layer for MiniMeTokenInterface. 
 */
contract DelegationProxyView is DelegationProxy {

    //storage of preprocessed view of FinalDelegate
    mapping(bytes32 => FinalDelegate) public delegationView;
    
    struct FinalDelegate {
        address delegate;
        bool found;
    }
    
    constructor(address _parentTopic) DelegationProxy(0x0) public {

    }
    
    /**
     * @notice Reads the final delegate of `_who` at block number `_block`.
     * @param _who Address to lookup.
     * @param _block From what block.
     * @return Final delegate address.
     */
    function delegationOfAt(
        address _who,
        uint _block
    )
        public
        view
        returns(address finalDelegate)
    {
        bytes32 searchIndex = keccak256(_who, _block);
        FinalDelegate memory search = delegationView[searchIndex];
        if (search.found) {
            return search.delegate;
        } else {
            return super.delegationOfAt(_who, _block);
        }
             
    } 

    /**
      * @notice Dig into delegate chain to find final delegate, makes delegationOfAt cheaper to call;
      *         Should be used when you want to track an isolated long delegation chain FinalDelegate
      * @param _delegator Address to lookup final delegate.
      * @param _block From what block.
      * @return True when found final delegate.
      */
    function findFinalDelegate(
        address _delegator,
        uint256 _block,
        uint256 loopLimit
    ) 
        external
        returns (bool) 
    {
        bytes32 searchIndex = keccak256(_delegator,_block);
        FinalDelegate memory search = delegationView[searchIndex];
        require(!search.found);
        for (uint i = 0; i < loopLimit; i++) {
            if (search.delegate == address(0)) {
                search.delegate = _delegator;
            }
            address delegateFrom = delegatedToAt(search.delegate, _block);
            if (delegateFrom == address(0)) {
                // search.delegate demonsted this address didnt delegated, 
                search.found = true; // so its the final delegate
            } else {
                search.delegate = delegateFrom;
            }
            if (search.found) {
                break;
            }
        }
        delegationView[searchIndex] = search; //save search
        return search.found;
    }

    /**
     * @notice Explore the chain from `_delegator`, saving FinalDelegate indexes for all delegates, makes delegationOfAt cheaper to call.
     *         Should be used to track a common FinalDelegates in a small delegation chain, saving gas on repetitive lookups;
     * @param _delegator Address to lookup final delegate.
     * @param _block From what block.
     * @param _stackLimit how much deep explore to build the indexes
     * @return address of delegate when found, or the last top delegate found if stacklimit reached without getting into FinalDelegate.
     */
    function buildFinalDelegateChain(
        address _delegator,
        uint256 _block,
        uint256 _stackLimit
    ) 
        public
        returns (address lastDelegate, bool found) 
    {
        require(_block > block.number); //cannot renderize current state view ?
        bytes32 searchIndex = keccak256(_delegator, _block);
        FinalDelegate memory search = delegationView[searchIndex];
        if (!search.found) {
            if (search.delegate == address(0)) {
                lastDelegate = delegatedToAt(_delegator, _block);
                if (lastDelegate == address(0)) {
                    //`_delegator` FinalDelegate is itself
                    lastDelegate = _delegator;
                    found = true;
                }
            }

            if (!found && _stackLimit > 0) {
                //`_delegator` FinalDelegate is the same FinalDelegate of it's `delegate`
                (lastDelegate, found) = buildFinalDelegateChain(lastDelegate, _block, _stackLimit - 1);
            } 
            delegationView[searchIndex] = FinalDelegate(lastDelegate, found);
        }
        return (lastDelegate, found);
    }

}