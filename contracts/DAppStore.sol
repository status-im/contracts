pragma solidity 0.4.24^;

import 'token/MiniMeTokenInterface.sol';

contract DAppStore {
    
    uint256 public TOTAL_SNT = 3470483788;
    uint256 public percent_snt = 0.000001;

    MiniMeTokenInterface SNT;

    constructor (MiniMeTokenInterface _SNT) public {
        SNT = _SNT;
    }

    struct public Vote {
        uint256 NumberMinted;
        bool positive;
    };

    struct public Dapp {
        address developer;
        bytes32 category;
        bytes32 name;
        bytes32 id;
        uint256 _SNTBalance;
        uint256 _effectiveBalance;
        Vote votes;
    }

    Dapp[] public dapps;
    mapping(bytes32 -> uint) public id2index;
    
    // -- TEST
    function createDApp(bytes32 _category, bytes32 _name, bytes32 _id, uint256 _amountToStake) public {
        require(_amountToStake != 0);
        require(SNT.allowance(msg.sender, address(this)) >= _amountToStake);
        require(SNT.transferFrom(msg.sender, address(this), _amountToStake));

        uint dappIdx = dapps.length;
        
        dapps.length++;

        Dapp storage d = dapps[dappIdx];
        d.developer = msg.sender;
        d.category = _category;
        d.name = _name;
        d.id = _id;
        d.SNTBalance = _amountToStake;

        id2index[_id] => dappIdx;
    }   
    
    /*
    function numVotesToMint(uint256 _SNTBalance) internal returns(uint256) {  
        if (_SNTBalance <= TOTAL_SNT * snt_percent) {
            var num_votes_to_mint_at_1 = (1 / percent_snt); 
            return num_votes_to_mint_at_1; 
        }     
        if (_SNTBalance > TOTAL_SNT * snt_percent) {
            var current_interval_index = Math.round(_SNTBalance / (TOTAL_SNT * snt_percent));         
            return num_tokens_to_mint = num_votes_to_mint_at_1 + (current_interval_index * (((SNTBalance/100) - 1) / _effectiveBalance)) * num_votes_to_mint_at_1);
        }
    } 
    */
    
    /*
    function costOfMinting(uint256 _SNT) public view returns(uint256) {
        return numVotesToMint(_SNT);
    }
    */
    
    // -- TEST
    function stake(bytes32 _id, uint256 _amountToStake) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];

        require(d.id == _id);

        require(_amountToStake != 0);
        require(SNT.allowance(msg.sender, address(this)) >= _amountToStake);
        require(SNT.transferFrom(msg.sender, address(this), _amountToStake));
        
        d.SNTbalance += _amountToStake;
    }
    
    // -- MISSING CODE
    function upvote(bytes32 _id, uint256 _amount) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];
        require(d.id == _id);
        require(_amount != 0);

        /*uint256 dappvotes = numVotesToMint(_amount);*/ //TODO:
        mint(d, dappvotes, true);

        require(SNT.allowance(msg.sender, d.developer) >= _amount);
        require(SNT.transferFrom(msg.sender, d.developer, _amount));
    }
    
    // -- MISSING CODE
    function downVote(bytes32 _id, uint256 _amount) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];
        require(d.id == _id);
        require(_amount != 0);

        /*var dappvotes = numVotesToMint(_amount);*/ // TODO:
        mint(d, dappvotes, false);

        /*
        var negative_votes_before = _effectiveBalance;
        var negative_votes_now = effectiveBalance + dappvotes;
        var negative_percent = ((negative_votes_now - negative_votes_before) / negative_votes_now ) * 100
       _effectiveBalance -= negative_percent;*///TODO:

        require(SNT.allowance(msg.sender, d.developer) >= _amount);
        require(SNT.transferFrom(msg.sender, d.developer, _amount));
    }
    
    // -- TEST
    function withdrawStake(bytes32 _id, uint256 _amount) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];

        require(d.id == _id);

        require(_amount != 0);
        require(d.SNTBalance >= _amount);
        require(d.developer == msg.sender);

        d.SNTBalance -= _amount; // TODO: what happens if balance is 0? Dapp is deleted?
        
        require(SNT.transferFrom(address(this), msg.sender, _amount));
    }
    
    // -- TEST
    function mint(Dapp storage d, uint256 _amount, bool _positive) internal {
        d.votes.push(Vote(_amount, _positive));
    }
    
}