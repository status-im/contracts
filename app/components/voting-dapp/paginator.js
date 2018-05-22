import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import {Button} from 'react-bootstrap';

class Paginator extends React.Component {

    constructor(props) {
      super(props);
      this.state = {

      };
    }

    render(){
        let ln = Math.ceil(this.props.total / this.props.recordsByPage);
        let btnArray = []
        for(let i = 1; i <= ln; i++){
            btnArray.push(<Button bsStyle="link" className={i == this.props.pageNum ? 'current' : ''} onClick={(e) => this.props.pageHandler(e, i)}>{i}</Button>)
        }

        return <div>
            <Button bsStyle="link" onClick={(e) => this.props.pageHandler(e, 1)}>&lt;</Button>
            {
                btnArray.map((component, index) => (
                <React.Fragment key={index}>
                    { component }
                </React.Fragment>
                ))
            }
            <Button bsStyle="link" onClick={(e) => this.props.pageHandler(e, ln)}>&gt;</Button>
        </div>;
    }

}

export default Paginator;
