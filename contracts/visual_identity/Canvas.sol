pragma solidity ^0.4.24;

import "../token/ERC20Token.sol";
import "../common/Controlled.sol";

contract Canvas is Controlled {

    struct Shape {
        bytes6 color;
        // TODO: add missing properties
    }

    struct Pixel {
        address owner;
        uint price;
        uint shapeIndex;
        uint lastPriceUpdate;
    }

    uint public constant GRID_X = 5;
    uint public constant GRID_Y = 5;

    Pixel[GRID_X][GRID_Y] public grid;

    Shape[] public shapes;

    ERC20Token public token;

    uint public publicBalance = 0;
    
    mapping(address => uint) public balances;

    address[] players;

    mapping(address => uint) playerIndex;

    uint public priceUpdatePeriod = 2 hours; // How long until the price of a pixel can be updated
    
    uint public lastTax;
    uint public taxPeriod = 30 minutes; // How much time between taxes
    uint public taxPercentage = 5;

    constructor(address _token) public {
        token = ERC20Token(_token);
        players.push(msg.sender);
    }


    /// @notice Add funds to your balance. Tax will be deducted from these funds
    function addFunds(uint amount) public {
        require(token.transferFrom(msg.sender, address(this), amount));
        token.approve(msg.sender, amount); 
        balances[msg.sender] += amount;
    }

    /// @notice Withdraw funds from your balance
    function withdrawFunds(uint amount) public {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] - amount <= balances[msg.sender], "Amount to withdraw must not be greater than balance");
        balances[msg.sender] -= amount;

        require(token.transfer(msg.sender, amount));
    }


    /// @notice Draw a pixel. Will transfer the price of a pixel if owned, or will use the empty price
    function draw(uint x, uint y, uint shapeIndex, uint priceIfEmpty) public {
        require(x < 350 && y < 350, "Invalid coordinate");
    

        // TODO: determine how we're going to create the shape

        Pixel storage p = grid[x][y];
        
        if(p.owner == msg.sender) return;
        
        if(playerIndex[msg.sender] == 0 && msg.sender != controller){
            uint idx = players.push(msg.sender) - 1;
            playerIndex[msg.sender] = idx;
        }

        if(p.owner == address(0)){
            // Empty pixel
            require(balances[msg.sender] >= priceIfEmpty, "Not enough balance. Add more funds");
            balances[msg.sender] -= priceIfEmpty;
            
            publicBalance += priceIfEmpty;
            p.price = priceIfEmpty;
        } else {
            // Pixel is owned
            require(balances[msg.sender] >= p.price, "Not enough balance. Add more funds");
            balances[msg.sender] -= p.price;
            balances[p.owner] += p.price;
        }

        p.lastPriceUpdate = 0; // New owner can change the price now
        p.owner = msg.sender;
        p.shapeIndex = shapeIndex;

        emit PixelDrawn(msg.sender, x, y, p.price);
    }


    /// @notice Leave the game, withdrawing the resulting balance, and returning your pixels to the public
    function leaveTheGame() public {
        // TODO: check performance. 
        //       Probably it's more efficient for each owner to have an array of indexes that point to their pixels
        for(uint x = 0; x < GRID_X; x++){
            for(uint y = 0; y < GRID_Y; y++){
                Pixel storage p = grid[x][y];
                if(p.owner == msg.sender){
                    // Release the properties to the public
                    p.owner = address(0);
                    p.lastPriceUpdate = 0;
                    p.price = 0;
                }
            }
        }

        withdrawFunds(balances[msg.sender]);
    }


    function canApplyTax() public view returns(bool){
        return lastTax + taxPeriod < block.timestamp;
    }
    
    
    function calculateTax(uint x, uint y) public view returns(uint){
        require(x < 350 && y < 350, "Invalid coordinate");
        Pixel storage p = grid[x][y];
        return p.price * taxPercentage / 100;
    }


    function tax() public onlyController {
        if(lastTax + taxPeriod > block.timestamp) return;

        lastTax = block.timestamp;

        // TODO: check performance
        for(uint x = 0; x < GRID_X; x++){
            for(uint y = 0; y < GRID_Y; y++){
                Pixel storage p = grid[x][y];
                if(p.owner != address(0)){
                    uint taxAmount = p.price * taxPercentage / 100;
                    if(balances[msg.sender] < taxAmount){
                        p.owner = address(0);
                        p.price = 0;
                        p.lastPriceUpdate = 0;
                    } else {
                        balances[msg.sender] -= taxAmount;
                        publicBalance += taxAmount;
                    }
                }
            }
        }
        
        emit TaxApplied(block.timestamp);
    }


    /// @notice View the price of a pixel
    function price(uint x, uint y) public view returns(uint){
        require(x < 350 && y < 350, "Invalid coordinate");

        Pixel storage p = grid[x][y];
        return p.price;
    }


    /// @notice Determine if you can update the price of a pixel
    function canUpdatePrice(uint x, uint y) public view returns(bool){
        require(x < 350 && y < 350, "Invalid coordinate");

        Pixel storage p = grid[x][y];

        require(p.owner == msg.sender, "You're not the owner of this pixel");

        return p.lastPriceUpdate + priceUpdatePeriod < block.timestamp;
    }


    /// @notice Set the price of a pixel
    function setPrice(uint x, uint y, uint newPrice) public {
        require(x < 350 && y < 350, "Invalid coordinate");

        Pixel storage p = grid[x][y];

        require(p.owner == msg.sender, "You're not the owner of this pixel");
        require(p.lastPriceUpdate + priceUpdatePeriod < block.timestamp, "You cannot update the price yet");

        p.price = newPrice;
        p.lastPriceUpdate = block.timestamp;

        emit PixelPriceUpdated(x, y, newPrice);
    }

    
    /// @notice After the hackathon ends, we return the SNT balances available to users 
    function gameOver() public onlyController {
        // TODO: check performance. Shouldn't matter in a sidechain, I guess
        for(uint i = 0; i < players.length; i++){
            uint amount = balances[players[i]];
            balances[players[i]] = 0;
            token.transferFrom(address(this), players[i], amount);
        }

        uint controllerAmount = balances[controller];
        balances[controller] = 0;
        token.transferFrom(address(this), controller, controllerAmount);

        selfdestruct(controller);
    }


    function setPriceUpdatePeriod(uint newPeriod) public onlyController {
        priceUpdatePeriod = newPeriod;
    }


    function setTaxPeriod(uint newPeriod) public onlyController {
        taxPeriod = newPeriod;
    }


    function setTaxPercentage(uint newPercentage) public onlyController {
        taxPercentage = newPercentage;
    }

    event PixelDrawn(address owner, uint x, uint y, uint price);
    event PixelPriceUpdated(uint x, uint y, uint newPrice);
    event TaxApplied(uint timestamp);
}
