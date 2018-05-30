import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React, {Component} from 'react';
import SNT from 'Embark/contracts/SNT'; // TODO change this to SNT

class StatusBar extends Component {

    constructor(props) {
      super(props);
      this.state = {
          balance: 0
      };
    }

    componentWillReceiveProps(){
        __embarkContext.execWhenReady(async () => {
            let _b = await SNT.methods.balanceOf(web3.eth.defaultAccount).call();
            this.setState({
                balance: _b
            });
        });
    }

    render(){
        return <div className="SNTBalance">
            SNT Voting Balance: <span>{this.state.balance}</span>
        </div>;
    }

}

export default StatusBar;
