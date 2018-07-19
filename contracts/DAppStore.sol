pragma solidity 0.4.23;

import './token/MiniMeTokenInterface.sol';

contract DAppStore {
    
    uint256 constant rate = 1.6;
    uint256 constant curve = 1 / rate;

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
        bytes category;
        bytes name;
        bytes32 id;
        uint256 SNTBalance;
        uint256 effectiveBalance;
        uint256 prevMinted;
        Vote[] votes;
    }

    Dapp[] public dapps;
    mapping(bytes32 => uint) public id2index;
    

    event DAppCreated(bytes32 id, uint256 amount);
    event IncreasedDAppStake(bytes32 id, uint256 amount);

    // -- TEST
    function createDApp(bytes _category, bytes _name, bytes32 _id, uint256 _amountToStake) public {
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
        d.prevMinted = _amountToStake / rate;

        id2index[_id] = dappIdx;

        emit DAppCreated(_id, _amountToStake);
    }   
    
    // -- TEST
    function numVotesToMint(Dapp storage d, uint256 _SNTBalance) internal view returns(uint256) {  
        uint256 cost = costOfMinting(d.id, _SNT);
        uint256 num_to_mint = 1 / cost;
        return num_to_mint;
    } 

    // -- TEST
    function costOfMinting(bytes32 _id, uint256 _SNT) public view returns(uint256) {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];
        require(d.id == _id);
        
        uint256 prev_minted = d.prevMinted;
        uint256 num_to_mint_1 = prev_minted + ((d.SNTBalance * prev_minted)/(d.SNTBalance + _SNT))**(curve);
        uint256 num_to_mint_percent_avail = curve * num_to_mint_1;
        uint256 percent_votes = (d.effectiveBalance / d.SNTBalance) * 100;
        uint256 votes_per_snt = percent_votes * num_to_mint_percent_avail;
        uint256 num_to_mint = num_to_mint_percent_avail - votes_per_snt;
        uint256 cost = 1 / num_to_mint;

        return cost;
    }
    
    // -- TEST
    function stake(bytes32 _id, uint256 _amountToStake) public {
        uint dappIdx = id2index[_id];
        Dapp storage d = dapps[dappIdx];

        require(d.id == _id);

        require(_amountToStake != 0);
        require(SNT.allowance(msg.sender, address(this)) >= _amountToStake);
        require(SNT.transferFrom(msg.sender, address(this), _amountToStake));
        
        uint newMinted = d.prevMinted + ((d.SNTBalance * d.prevMinted)/(d.SNTBalance + _amountToStake))**(curve);
        d.prevMinted == newMinted;
        d.SNTBalance += _amountToStake;

        emit IncreasedDAppStake(_id, _amountToStake);
    }
    
    // -- TEST
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
        
        // TODO: this is the biggest problem with tracking prevMinted - not sure how to handle it when
        // the developer withdraws stake. What happens if more votes per SNT havebeen cast than votes 
        // are available after the withdrawal, for instance?
        uint newMinted = d.prevMinted - ((d.SNTBalance * d.prevMinted)/(d.SNTBalance + _amount))**(curve);
        d.prevMinted == newMinted;
        
        d.SNTBalance -= _amount; // TODO: what happens if balance is 0? Dapp is deleted?
        
        require(SNT.transferFrom(address(this), msg.sender, _amount));
    }
    
    // -- TEST
    function mint(Dapp storage d, uint256 _amount, bool _positive) internal {
        d.votes.push(Vote(_amount, _positive));
    }
    
}
