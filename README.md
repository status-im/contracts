# Visual Identity

## Inspiration
https://discuss.status.im/t/status-identicon/184

https://satoshis.place/ 

#### referencing
https://docs.google.com/document/d/1fRP6cq6oWS0ckunovO3-awxgAKqITzKmNGuNlFi1v1M/edit?ts=5b4ecda9

## Purpose
A living visual identity system for the hackathon in Prague, October 2018, under the theme ‘cryptolife’.
We are proposing for the hackathon identity to be shaped by those individuals attending with a graphic tool.

### How It Works
After an attendee registers they are invited to visit and draw by using fractional ERC721 SNT coins (1 coint per pixel) to create the event logo communally. Attendees could be give a certain amount of SNT to use or we fix the amount. (for example 20 SNT)

The users are free to draw up to a certain amount with SNT and if a user draws over another user’s pixels,  the SNT will be returned to that user who has been drawn over. This also presents an interesting opportunity for users collaborating who want to influence a larger part of the overall design.

Attendees may draw upon the grid until the final deadline (TBD or ongoing into the event?) as we will need to create production assets with the final design. We will also create a series of supporting visual assets using the same (grid) system and language to support the idea. (t-shirts, posters, stickers, flags, etc).

We would also like to gift a unique token collectible of the visual available for each attendee at the event. This can be done using https://superrare.co/.

### DAO

Ultimately we are all able to help shape a communal identity for the conference using the technology and wrap this entire project and it's assets up in a DAO and let everyone who participates in it have a stake in the DAO so even after the conference they will continue to vote and decide what it does next, in that sense it will be dynamic living thing.


## Usage
 ```
 npm install -g embark
 git clone https://github.com/status-im/contracts.git
 cd contracts
 npm install
 embark simulator
 embark test
 embark run
 ```

## Activities done
1. We installed Loom in two Ubuntu Servers, as a multinode deployment, configured manually. We originally ran into issues related to validation of blocks, but these were corrected with the `build-330`.
2. Additional to the default Coin plugin, we configured the Tiles contract from the examples on these servers, and could communicate successfully with these chains, and saw the data synchronized between the servers.
Since we use Embark as the framework used to develop dapps, we did not have an automated way to generate the binary file used by Loom. We proceeded to modify the `embark_solc` plugin for Embark to generate this .bin file for any contract we need.
3. Installation was modified to use Embark instead of truffle for deploying the contracts. A writeup of running procedure can be seen here:
https://github.com/status-im/contracts/tree/visual-identity/plasma_cash
https://github.com/status-im/contracts/tree/visual-identity/loom_js_test
4. Both erc721-plasma (with build-246) from Loom, and plasma_mvp from Omise were downloaded and installed on these servers. We noticed that additional packages are needed to be able to run these examples if installing on a server built from scratch: `python3-dev libssl-dev` besides the normal `virtualenv python3` and `build-essential` packages

## Plans
In order to enter the sidechain, we're considering creating a ERC721 token that can be acquired with SNT (our ERC20 token). An idea is to do the exchange automatically during the deposit and withdraw.

A service will be built that will periodically submit blocks and finalize exits. Probably will allow the users to challenge exits of their coins as well.

Also under research is the option to avoid creating an ERC721 token at all, and just use the ERC20 token.
