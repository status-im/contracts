import web3 from "Embark/web3"
import EmbarkJS from 'Embark/EmbarkJS';
import React, {Fragment} from 'react';
import {Button} from 'react-bootstrap';

const Paginator = props => {
    let ln = Math.ceil(props.total / props.recordsByPage);
    let btnArray = []
    for(let i = 1; i <= ln; i++){
        btnArray.push(<Button 
                            bsStyle="link" 
                            className={i == props.pageNum ? 'current' : ''} 
                            onClick={(e) => props.pageHandler(e, i)}>{i}</Button>)
    }

    return <div>{
            btnArray.map((component, index) => (
                <Fragment key={index}>
                    { component }
                </Fragment>
            ))
        }</div>;
};

export default Paginator;
