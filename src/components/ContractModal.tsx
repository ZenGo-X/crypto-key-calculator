import{ ethers } from 'ethers';
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthereum  } from '@fortawesome/free-brands-svg-icons';

function ContractModal(props: any) {
  const [show, setShow] = useState(props.show);
  const signer = props.signer;

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const [inputs, setInputs] = useState({});
  function changeInput(e: any){
    console.log(e.target.value)
    console.log(e.target.id)
    let newInput: any = inputs;
    newInput[e.target.value] = e.target.id;
    setInputs(newInput);
  }
  function createInputs(n: Number){
    let content = [];
    for (var i=0; i<n; i++){
      content.push(
        <Form.Group className="mb-3" controlId="formBasicEmail" key={'reactKey'+i}>
          <Form.Label>{`Key ${i+1}:`}</Form.Label>
          <Form.Control id={i.toString()} onChange={changeInput} type="text" placeholder="Input your public or public address" />
        </Form.Group>
      );
    }
    return content;
  }

  async function compileAndDeploy () {

    const contractCode = `
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
            return (k[0] && k[1]) || k[2];
        }
    }
    `;
    /*
    const booleanFormula = roiCode();
    function boolAuthorized(bool[] memory k) internal pure override returns (bool){
          return ${booleanFormula}
        }
    */
   // 'return k[3] && k[2] && k[4],81.55'.split(',')[0].slice('return '.length).replaceAll('&&','and')
    const worker = new Worker("worker.js");
    worker.postMessage(JSON.stringify({
      language: "Solidity",
      sources: {"": { content: contractCode }},
      settings: {
        optimizer: { enabled: true, runs: 2000000 },
        outputSelection: { "*": {"*": ['evm.bytecode.object','abi']}}
      }
    }));
    worker.addEventListener('message', async (message) => {
      const result = JSON.parse(message.data);
      const contractCompiled = result.contracts[""].SampleThreeWallet;
      const bytecode = contractCompiled.evm.bytecode;
      const abi = contractCompiled.abi;

      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      const contract = await factory.deploy([
        "0xF5DF2bd8A867C0A166f5FF6661D8483C6DC48db9",
        "0xF5DF2bd8A867C0A166f5FF6661D8483C6DC48d89"
      ]);
      console.log(contract);
    });
  }

  return (
    <>
      <Button variant='dark-lavender' onClick={handleShow}>
        Input keys
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Deploy your wallet with your keys</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <Form>
          { createInputs(props.numberOfKeys) }
        </Form>
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
    </>
  );
}

export default ContractModal;