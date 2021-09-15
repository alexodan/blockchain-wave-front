import * as React from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import CircularProgress from "@material-ui/core/CircularProgress";
// import Modal from "@material-ui/core/Modal";
// import TextField from "@material-ui/core/TextField";
import { Theme } from "./constants";

export default function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [isMining, setIsMining] = React.useState(false);
  const [allWaves, setAllWaves] = React.useState([]);
  const [message, setMessage] = React.useState("");
  const [theme, setTheme] = React.useState(Theme.Dark);

  const contractAddress = "0xd13805a673Eaa001815EccF8ca012A4689e13867";
  const contractABI = abi.abi;

  const getAllWaves = React.useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    const waves = await wavePortalContract.getAllWaves();
    const wavesCleaned = waves.map((wave) => {
      return {
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      };
    });

    setAllWaves(wavesCleaned);

    wavePortalContract.on("NewWave", (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((oldArray) => [
        ...oldArray,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    });
  }, [contractABI]);

  const checkIfWalletIsConnected = React.useCallback(() => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have Metamask!");
      return;
    } else {
      console.log("We have the ethereum object: ", ethereum);
    }

    ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrAccount(account);
      } else {
        console.log("No authorized account found");
      }
    });
    getAllWaves();
  }, [getAllWaves]);

  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("You need Metamask to connect!");
      return;
    }
    ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        console.log("Connected:", accounts[0]);
        setCurrAccount(accounts[0]);
      })
      .catch((err) => console.error(err));
  };

  const waveMe = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let count = await wavePortalContract.getTotalWaves();
    console.log("Retrieved total wave count: ", count.toNumber());

    const waveTxn = await wavePortalContract.wave(message, {
      gasLimit: 300000,
    });
    console.log("Mining...", waveTxn.hash);
    setIsMining(true);

    await waveTxn.wait();
    console.log("Mined -- ", waveTxn.hash);
    setIsMining(false);

    count = await wavePortalContract.getTotalWaves();
    console.log("Retrieved total wave count...", count.toNumber());

    setMessage("");
    // getAllWaves();
  };

  React.useEffect(() => {
    checkIfWalletIsConnected();
  }, [checkIfWalletIsConnected]);

  return (
    <div className={`wrapper ${theme}`}>
      <button
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          backgroundColor: "transparent",
          fontSize: "36px",
          cursor: "pointer",
          border: "none",
        }}
        onClick={() =>
          setTheme((currTheme) => (currTheme === "light" ? "dark" : "light"))
        }
      >
        {theme === "light" ? (
          <span role="img" aria-label="dark">
            🌛
          </span>
        ) : (
          <span role="img" aria-label="light">
            ☀️
          </span>
        )}
      </button>
      <div className="mainContainer">
        <div className="dataContainer">
          {!currAccount && (
            <button className="walletButton" onClick={connectWallet}>
              Connect to a wallet
            </button>
          )}

          <div className="header">
            Hola!{" "}
            <span role="img" aria-label="wave">
              👋
            </span>
          </div>

          <div className="bio">
            <p>
              My name is Alex and I work as web a developer building stuff that
              runs on the web, and now on the blockchain too!
            </p>
            <p
              style={{
                fontStyle: "italic",
                fontWeight: "bold",
                marginBottom: "0px",
              }}
            >
              Connect your Ethereum wallet and wave at me!
            </p>
            <p style={{ marginTop: "0px" }}>
              There is a small chance you win some rinkeby eth doing it{" "}
              <span role="img" aria-label="emoji">
                👀
              </span>
            </p>
          </div>

          <textarea
            id="message"
            className="input-message"
            placeholder="Post your message!"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <button
            className="waveButton"
            onClick={waveMe}
            disabled={isMining || currAccount === ""}
            title={currAccount === "" ? "You need to connect your wallet" : ""}
          >
            {isMining ? <CircularProgress /> : "Send"}
          </button>

          {allWaves.map((wave, idx) => {
            return (
              <div key={idx} className="wave-message">
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
