import { ethers } from "ethers";
import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthereum  } from '@fortawesome/free-brands-svg-icons';
//import { Compiler } from '@remix-project/remix-solidity';
// nico here
import * as wrapper from 'solc/wrapper';

console.log(wrapper)

declare let window: any

const Metamask = () => {
  const [isDeployed, setIsDeployed] = useState(false);
  const [contractAddress, setContractAddress] = useState('');

  async function connectMetamask () {
    var input = {
      language: 'Solidity',
      sources: {
        'test.sol': {
          content: 'contract C { function f() public { } }'
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        }
      }
    };

    let worker = new Worker( new URL('worker.js', import.meta.url), {type: 'module'});
    worker.postMessage(10)
    worker.onmessage = (message) => {
      console.log(message.data);
    }

    //const objectC = new Compiler(require("./Lock.sol"));

    //const output = JSON.parse(solc.compile(JSON.stringify(input)));
    //const version = 'v0.5.1-stable-2018.12.03'
    //const output = await solcjs();
    //console.log(output)
    //const provider = new ethers.providers.Web3Provider(window.ethereum);
    //const factory = ethers.ContractFactory.fromSolidity(output);

    setIsDeployed(true);
    setContractAddress('TODO: Contract Address goes HERE');
  }

  return (<>
    {isDeployed ?
      <div>{`The contract address is ${contractAddress}`}</div>
    :
    <Button style={{ border: 'none', background: '#F6851B', color: '#233447', marginTop: '5px'}} onClick={() => connectMetamask()}>
      Connect to Metamask
      <FontAwesomeIcon icon={faEthereum} color='#233447' style={{marginLeft: '5px'}}/>
    </Button>
    }
  </>);
}


export default Metamask;