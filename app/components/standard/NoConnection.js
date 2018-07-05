import React from "react";
import styles from "./style.js";
import EthereumLogo from "./../assets/ethereum-logo.svg";
import MetamaskLogo from "./../assets/metamask-logo.svg";

const NoConnection = () => {
  return (
    <div style={styles.NoEthereumSection}>
      <img style={styles.ImgHeaderLogo} alt="Status" src="images/logo.png" />
      <hr />
      <img
        style={styles.ImgEthereumLogo}
        alt="Ethereum"
        src={EthereumLogo}
      />
      <h2>NOT CONNECTED TO ETHEREUM MAINNET</h2>
      <p style={styles.PNotFound}>
        This application requires an Ethereum client to be running and connected to Mainnet. A client
        could not be detected which probably means it&#39;s not
        installed, running or is misconfigured.
      </p>
      <p style={styles.PUseClients}>
        Please use one of the following clients to connect to Ethereum:
      </p>
      <div style={styles.DivClients}>
        <div style={styles.DivSubClients}>
          <img style={styles.ImgLogo} alt="Metamask" src={MetamaskLogo} />
          <h2>METAMASK</h2>
          <p>
            <span style={styles.AlignNumber}>
              <span style={styles.NumberCircle}>1</span>
            </span>Install
            <a
              href="https://metamask.io/"
              rel="noopener noreferrer"
              target="_blank"
            >
              {" "}
              Metamask
            </a>
          </p>
          <p>
            <span style={styles.AlignNumber}>
              <span style={styles.NumberCircle}>2</span>
            </span>Use Chrome to browse
            <a
              rel="noopener noreferrer"
              href="https://vote.status.im"
              target="_blank"
            >
              {" "}
              https://vote.status.im
            </a>
          </p>
        </div>
        <div style={styles.DivSubClients}>
          <img style={styles.ImgLogo} alt="Mist" src="images/mist.png" />
          <h2>MIST</h2>
          <p>
            <span style={styles.AlignNumber}>
              <span style={styles.NumberCircle}>1</span>
            </span>Install and run
            <a
              rel="noopener noreferrer"
              href="https://github.com/ethereum/mist/releases"
              target="_blank"
            >
              {" "}
              Mist
            </a>
          </p>
          <p>
            <span style={styles.AlignNumber}>
              <span style={styles.NumberCircle}>2</span>
            </span>
            Use Mist to browse
            <a
              rel="noopener noreferrer"
              href="https://vote.status.im"
              target="_blank"
            >
              {" "}
              https://vote.status.im
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

NoConnection.displayName = "NoConnection";

export default NoConnection
