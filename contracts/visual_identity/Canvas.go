package main

import (
	"github.com/loomnetwork/go-loom/plugin"
	contract "github.com/loomnetwork/go-loom/plugin/contractpb"
)

func main() {
	plugin.Serve(Contract)
}

type Canvas struct {
}

func (e *Canvas) Meta() (plugin.Meta, error) {
	return plugin.Meta{
		Name:    "Canvas",
		Version: "0.0.1",
	}, nil
}

func (e *Canvas) Init(ctx contract.Context, req *plugin.Request) error {
	return nil
}

// TODO: constructor

// TODO: getters for public variables

// TODO: addFunds(uint amount) public

// TODO: withdrawFunds(uint amount) public

// TODO: draw(uint x, uint y, uint shapeIndex, uint priceIfEmpty) public

// TODO: leaveTheGame() public

// TODO: canApplyTax() public view returns(bool)

// TODO: calculateTax(uint x, uint y) public view returns(uint)

// TODO:  tax() public onlyController

// TODO:  price(uint x, uint y) public view returns(uint)

// TODO: canUpdatePrice(uint x, uint y) public view returns(bool)

// TODO: setPrice(uint x, uint y, uint newPrice) public

// TODO: gameOver() public onlyController

// TODO: setPriceUpdatePeriod(uint newPeriod) public onlyController

// TODO: setTaxPeriod(uint newPeriod) public onlyController

// TODO: setTaxPercentage(uint newPercentage) public onlyController

var Contract plugin.Contract = contract.MakePluginContract(&Canvas{})
