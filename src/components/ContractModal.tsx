import{ ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthereum  } from '@fortawesome/free-brands-svg-icons';

declare let window:any;

function ContractModal(props: any) {
  const [show, setShow] = useState(props.show);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  function createInputs(n: Number){
    let content = [];
    for (var i=0; i<n; i++){
      content.push(
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>{`Key ${i+1}:`}</Form.Label>
          <Form.Control type="text" placeholder="Input your public or public address" />
        </Form.Group>
      );
    }
    return content;
  }

  const [sig, setSig] = useState<any>();
  async function initializeMetamask() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    setSig(signer);
  }
  useEffect(() => {
    initializeMetamask();
  }, []);
  async function compileAndDeploy () {

    const contractCode = `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    contract FinalWallet {
        function helloWorld() public pure returns (string memory) {
            return "Hello, World!";
        }
    }`;
    /*
    const booleanFormula = roiCode();
    function boolAuthorized(bool[] memory k) internal pure override returns (bool){
          return ${booleanFormula}
        }
    */
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
      const contractCompiled = result.contracts[""].FinalWallet;
      const bytecode = contractCompiled.evm.bytecode;
      const abi = contractCompiled.abi;

      const factory = new ethers.ContractFactory(abi, bytecode, sig);
      const contract = await factory.deploy();
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