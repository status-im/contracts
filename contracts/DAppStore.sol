pragma solidity 0.4.24^;

contract DAppStore {
    
    address public _developer;
    uint256 public TOTAL_SNT = 3470483788;
    uint256 public percent_snt = 0.000001;
    struct public Vote {
        uint256 NumberMinted;
        bool positive;
    };  
    struct public Dapp {
        bytes32 category;
        bytes32 name;
        bytes32 id;
        uint256 _SNTBalance;
        uint256 _effectiveBalance;
        Vote votes;
    }
    mapping (uint => Dapp) dapps;
    
    function createDApp(bytes32 _category, bytes32 _name, bytes32 _id) public {
        require(msg.data.tokens > 0); 
        _developer = msg.sender;
        dapp.category = _category;
        dapp.name = _name;
        dapp.id = _id;
        // set the _SNTbalance in the mapping with msg.data.tokens
        // store the uint for mapping from dapps to this DApp with the id somehow, so that Status can identify legit dapps.
    }   
    
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
    
    function costOfMinting(uint256 _SNT) public view returns(uint256) {
        return numVotesToMint(_SNT);
    }
    
    function stake() public {
        SNTbalance += msg.data.tokens;
    }
    
    function upvote() public {
        var dappvotes = numVotesToMint(msg.data.tokens);
        mint(dappvotes, true);
        send(msg.data.tokens);
    }
    
    function downVote() public {
        var dappvotes = numVotesToMint(msg.data.tokens);
        mint(dappvotes, false);
        var negative_votes_before = _effectiveBalance;
        var negative_votes_now = effectiveBalance + dappvotes;
        var negative_percent = ((negative_votes_now - negative_votes_before) / negative_votes_now ) * 100
       _effectiveBalance -= negative_percent;
       send(msg.data.tokens);
    }
    
    function withdrawStake(uint256 _amount) public {
        if(msg.sender == developer && _amount <= SNTBalance) {
            SNTBalance -= _amount;
            send(_amount);
        }
    }
    
    function mint(uint256 _amount, bool _positive) internal {
        votes.push(Vote(_amount, _positive));
    }
    
    function send(uint256 _amount) internal {
        send(_developer, _amount);
    }
}