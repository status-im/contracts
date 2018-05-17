import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Navbar, NavItem, Nav, MenuItem , NavDropdown} from 'react-bootstrap';
import AccList from './acclist'; 
class TopNavbar extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        
      }
      
    }  

    render(){

      return (
      <React.Fragment>
          <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#home">Status.im Demo</a>
            </Navbar.Brand>
          </Navbar.Header>
          <AccList />
        </Navbar>
      </React.Fragment>
      );
    }
  }

  export default TopNavbar;