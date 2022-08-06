import{ ethers } from 'ethers';
import {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthereum  } from '@fortawesome/free-brands-svg-icons';
import Confetti from 'react-confetti'

declare let window: any;

function ContractModal(props: any) {
  const [show, setShow] = useState(props.show);
  const [showResult, setShowResult] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleResultClose = () =>  setShowResult(false);

  const [inputs, setInputs] = useState<any>({});

  function changeInput(e: any){
    const target = e.target;
    let newInput: any = inputs;
    newInput[target.id] = target.value;
    setInputs(newInput);
  }

  function createInputs(n: Number){
    let content = [];
    for (var i=0; i<n; i++){
      content.push(
        <Form.Group className="mb-3" controlId="formBasicEmail" key={'reactKey'+i}>
          <Form.Label>{`Key ${i}:`}</Form.Label>
          <Form.Control id={i.toString()} onChange={changeInput} type="text" placeholder="Input public addresses" />
        </Form.Group>
      );
    }
    return content;
  }

  function getInputKeys(){
    let keys: any[] = [];
    for (let i=0; i<props.keyNum; i++){
      const value = inputs[i];
      keys.push(value);
    }
    return keys;
  }

  const [contractAddress, setContractAddress] = useState('');
  const [contractCode, setContractCode] = useState("Optimize a wallet to view contract");

  const getContractCode = (optimalWalletString: any) => {
    return `
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.15;

    abstract contract AbstractWallet {
        uint nonce;
        mapping (address => uint) keys;

        constructor(address[] memory pubKeys) {
            for (uint i = 0; i < pubKeys.length; i++) {
                keys[pubKeys[i]] = i+1;
            }
        }

        receive() external payable { }

        function getNonce() public view returns (uint) {
            return nonce;
        }

        function isAuthorized(bytes32 msgHash, bytes[] calldata signatures) internal virtual returns (bool);

        function requireAuthorized(bytes32 msgHash, bytes[] calldata signatures) internal {
            require(isAuthorized(msgHash, signatures), "Not Authorized");
        }

        function transfer(address payable destination, uint amount, bytes[] calldata signatures) external {
            uint n  = nonce;
            bytes32 msgHash = hashTransfer(n, destination, amount);
            requireAuthorized(msgHash, signatures);
            nonce = n + 1;
            destination.transfer(amount);
        }

        function hashTransfer(uint n, address destination, uint amount) public pure returns (bytes32) {
            return keccak256(abi.encodePacked("transfer", n, destination, amount));
        }

        function call(address dest, bytes calldata cd, uint amount, bytes[] calldata signatures) external {
            uint n  = nonce;
            bytes32 msgHash = hashCall(n, dest, cd, amount);
            requireAuthorized(msgHash, signatures);
            nonce = n + 1;
            (bool success, bytes memory errMsg) = dest.call{value:amount}(cd);
            require(success, string(errMsg));
        }

        function hashCall(uint n, address destination, bytes calldata cd, uint amount) public pure returns (bytes32) {
            return keccak256(abi.encodePacked("call", n, destination, cd, amount));
        }

        function replace(address originalKey, address newKey, bytes[] calldata signatures) external {
            uint n  = nonce;
            bytes32 msgHash = hashReplace(n, originalKey, newKey);
            requireAuthorized(msgHash, signatures);
            nonce = n + 1;
            replaceOne(originalKey, newKey);
        }

        function replaceOne(address originalKey, address newKey) internal {
            uint originalPos = keys[originalKey];
            require(originalPos != 0, "Not an original key");
            require(keys[newKey] == 0, "Not an new key");
            keys[newKey] = originalPos;
            keys[originalKey] = 0;
        }

        function hashReplace(uint n, address a, address b) public pure returns (bytes32) {
            return keccak256(abi.encodePacked("replace", n, a, b));
        }

        function rotate(address[] memory originalKeys, address[] memory newKeys, bytes[] calldata signatures) external {
            require(originalKeys.length == newKeys.length, "keys must have same length");
            uint n  = nonce;
            bytes32 msgHash = hashRotate(n, originalKeys, newKeys);
            requireAuthorized(msgHash, signatures);
            nonce = n + 1;
            for(uint i=0;i<originalKeys.length;i++) {
                replaceOne(originalKeys[i], newKeys[i]);
            }
        }

        function hashRotate(uint n, address[] memory a, address[] memory b) public pure returns (bytes32) {
            return keccak256(abi.encodePacked("rotate", n, a, b));
        }

        function recoverSig(bytes calldata sig, bytes32 msgHash) internal pure returns (address) {
            uint8 v = uint8(sig[64]);
            uint src;
            assembly {
                src := sig.offset
            }
            bytes32 r;
            assembly {
                r := calldataload(src)
            }
            src += 0x20;
            bytes32 s;
            assembly {
                s:= calldataload(src)
            }
            return ecrecover(msgHash, v, r, s);
        }
    }

    abstract contract BoolWallet is AbstractWallet {
        uint total;
        constructor(address[] memory pubKeys) AbstractWallet(pubKeys) {
            total = pubKeys.length;
        }

        function isAuthorized(bytes32 msgHash, bytes[] calldata signatures) internal view override returns (bool) {
            bool[] memory hasSig = new bool[](total);
            for(uint i = 0; i < signatures.length; i++) {
                uint pos = keys[recoverSig(signatures[i], msgHash)];
                if (pos > 0) {
                    hasSig[pos - 1] = true;
                }
            }
            return boolAuthorized(hasSig);
        }

        function boolAuthorized(bool[] memory hasSig) internal view virtual returns (bool);
    }

    contract SampleThreeWallet is BoolWallet {
        constructor(address[] memory pubKeys) BoolWallet(pubKeys) {
        }

        function boolAuthorized(bool[] memory k) internal pure override returns (bool) {
            ${optimalWalletString.split(',')[0]}
        }
    }
    `;
  }

  useEffect(
    () => {
      setContractCode(getContractCode(props.optimalWalletString));
    }, [props.optimalWalletString]);

  async function compileAndDeploy () {
    const worker = new Worker("worker.js");
    const contractCode = getContractCode(props.optimalWalletString);
    worker.postMessage(JSON.stringify({
      language: "Solidity",
      sources: {"": { content: contractCode }},
      settings: {
        optimizer: { enabled: true, runs: 2000000 },
        outputSelection: { "*": {"*": ['evm.bytecode.object','abi']}}
      }
    }));

    worker.addEventListener('message', async (message) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const result = JSON.parse(message.data);
      const contractCompiled = result.contracts[""].SampleThreeWallet;
      const bytecode = contractCompiled.evm.bytecode;
      const abi = contractCompiled.abi;

      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      const inputKeys = getInputKeys();
      const contract = await factory.deploy(inputKeys);
      setContractAddress(contract.address);
      setShow(false);
      setShowResult(true);
    });
  }

  const displayDefaultWarning = (optimalWalletString: any) => {
    if (optimalWalletString === "return k[0];") {
      return <h1 style={{color: "red"}}>Yo! Default Wallet!! Authorizes only on 1st key!</h1>
    } else {
      return <div/>
    }
  }

  return (
    <>
      <Button variant='dark-lavender' onClick={handleShow}>
        Input Keys & Deploy
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Deploy your wallet with your keys</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {displayDefaultWarning(props.optimalWalletString)}
        <Form>
          { createInputs(props.keyNum) }
        </Form>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
            <Form.Label>Your wallet code is:</Form.Label>
            <Form.Control as="textarea" rows={10} defaultValue={contractCode}/>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            style={{ border: 'none', background: '#F6851B', color: '#233447', marginTop: '5px'}}
            onClick={() => compileAndDeploy()}>
            Compile & Deploy
            <FontAwesomeIcon icon={faEthereum} color='#233447' style={{marginLeft: '5px'}}/>
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showResult} onHide={handleResultClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Your wallet is deployed!!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <h3>Your wallet is deployed at:</h3>
            <h3>
              <a href={`https://goerli.etherscan.io/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">
                {contractAddress}
              </a>
            </h3>
            <Confetti style={{width: '100%'}}/>
          </div>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ContractModal;