pragma solidity 0.4.23;

import './token/MiniMeTokenInterface.sol';

contract DAppStore {
    
    uint256 constant percentage_num = 1;
    uint256 constant percentage_den = 100000;
    // if num = 1, and den = 100000, num/den = 0.000001

    MiniMeTokenInterface SNT;

    constructor (MiniMeTokenInterface _SNT) public {
        SNT = _SNT;
    }

    struct Vote {
        uint256 NumberMinted;
        bool positive;
    }

    struct Dapp {
        address developer;
        bytes32 category;
        bytes32 name;
        bytes32 id;
        uint256 SNTBalance;
        uint256 _effectiveBalance;
        Vote[] votes;
    }

    Dapp[] public dapps;
    mapping(bytes32 => uint) public id2index;
    
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

        id2index[_id] = dappIdx;
    }   
    
    // -- CODE MISSING
    function numVotesToMint(Dapp storage d, uint256 _SNTBalance) internal view returns(uint256) {  
        uint TOTAL_SNT = d.SNTBalance;
        uint SNT_PROPORTION = TOTAL_SNT * percentage_num;
        assert(SNT_PROPORTION / TOTAL_SNT == percentage_num);
        SNT_PROPORTION /= percentage_den;

        uint num_votes_to_mint_at_1 =  percentage_den / percentage_num;

        if (_SNTBalance <= SNT_PROPORTION) {
            return num_votes_to_mint_at_1; 
        }

        if (_SNTBalance > SNT_PROPORTION) {
            uint current_interval_index = _SNTBalance / SNT_PROPORTION;         
            
            return 1;
            // TODO:
            // return num_votes_to_mint_at_1 + ((current_interval_index * (((_SNTBalance/100) - 1) / d._effectiveBalance)) * num_votes_to_mint_at_1);
        }
    } 

    // -- TEST
    function costOfMinting(bytes32 _id, uint256 _SNT) public view returns(uint256) {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];
        require(d.id == _id);
        return numVotesToMint(d, _SNT);
    }
    
    // -- TEST
    function stake(bytes32 _id, uint256 _amountToStake) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];

        require(d.id == _id);

        require(_amountToStake != 0);
        require(SNT.allowance(msg.sender, address(this)) >= _amountToStake);
        require(SNT.transferFrom(msg.sender, address(this), _amountToStake));
        
        d.SNTBalance += _amountToStake;
    }
    
    // -- MISSING CODE
    function upvote(bytes32 _id, uint256 _amount) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];
        require(d.id == _id);
        require(_amount != 0);

        uint256 dappvotes = numVotesToMint(d, _amount);
        mint(d, dappvotes, true);

        require(SNT.allowance(msg.sender, d.developer) >= _amount);
        require(SNT.transferFrom(msg.sender, d.developer, _amount));
    }
    
    // -- TEST
    function downVote(bytes32 _id, uint256 _amount) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];
        require(d.id == _id);
        require(_amount != 0);

        uint dappvotes = numVotesToMint(d, _amount);
        mint(d, dappvotes, false);

        uint negative_votes_before = d.effectiveBalance;
        uint negative_votes_now = d.effectiveBalance + dappvotes;
        uint negative_percent = ((negative_votes_now - negative_votes_before) * 100 / negative_votes_now );
        d.effectiveBalance -=   d.effectiveBalance * negative_percent / 100;

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