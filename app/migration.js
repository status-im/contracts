import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import PollManager from 'Embark/contracts/PollManager';

  


EmbarkJS.onReady(async (err) => {
    const { nPolls, poll } = PollManager.methods;

    console.log("WAIT UNTIL DONE");
    console.group("Polls and Votes");


    const numPolls = await nPolls().call();

    const polls = [];
    for (let i = numPolls - 1; i >= 0; i--) {
        const p = await poll(i).call();

        console.log(`_polls[${i}] = Poll({canceled: ${p._canceled}, description: "${p._description}", startBlock: ${p._startBlock}, endBlock: ${p._endBlock}, qvResults: ${p._qvResults}, results: ${p._results}, voters: ${p._voters}});`);
    }

    const events = await PollManager.getPastEvents("allEvents", {fromBlock: 5900136, toBlock: "latest"});
    
    let votes = [];
    for (let i = 0; i < events.length; i++){
        switch(events[i].event){
            case 'PollCreated':
                votes.push({});
                break;
            case 'Vote':
                votes[events[i].returnValues.idPoll][events[i].returnValues._voter] = events[i].returnValues.amount;
                break;
            case 'Unvote':
                delete votes[events[i].returnValues.idPoll][events[i].returnValues._voter];
                break;
        }
    }

    for(let i = 0; i < votes.length; i++){
        for(let address in votes[i]){
            console.log(`_polls[${i}].votes[${address}] = ${votes[i][address]};`);
        }
    }

    console.groupEnd();
    console.log("DONE");

})