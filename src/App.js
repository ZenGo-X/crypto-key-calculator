import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [keyNum, setKeyNum] = useState(1);
  const [keyProbabilityTable, setKeyProbabilityTable] = useState({
    safe: [0.7],
    leaked: [0.05],
    lost: [0.15],
    stolen: [0.1]
  });
  const [keyProbabilitiesUpdatedTable, setKeyProbabilitiesUpdatedTable] = useState({});
  const [wallet, setWallet] = useState([]);
  const keyStates = ['safe', 'leaked', 'lost', 'stolen'];
  const floatingPrecision = 8;
  const [combinationToAdd, setCombinationToAdd] = useState([]);
  const [selectedKeyForCombination, setSelectedKeyForCombination] = useState(-1);
  const [isEditingProbabilities, setIsEditingProbabilities] = useState(false);
  let curOptimalWallet = [];
  let maxSuccessForWallet = 0;
  const [optimalWallet, setOptimalWallet] = useState([]);
  const [optimalWalletProb, setOptimalWalletProb] = useState(0);

  function renderTableHeader() {
    let header = [" ", " "].concat(Object.keys(keyProbabilityTable));
    return header.map((key, index) => {
      return <th key={index}>{key.toUpperCase()}</th>
    });
  }

  function updateKeyProbabilities(state, index, percent) {
    keyProbabilitiesUpdatedTable[state][index] = percent / 100;
    setKeyProbabilitiesUpdatedTable(keyProbabilitiesUpdatedTable);
  }

  function toggleEditingMode() {
    if (isEditingProbabilities) {
      for (let i = 0; i < keyNum; i++) {
        if (parseFloat((keyProbabilitiesUpdatedTable.safe[i] + keyProbabilitiesUpdatedTable.leaked[i] + keyProbabilitiesUpdatedTable.lost[i] + keyProbabilitiesUpdatedTable.stolen[i]).toFixed(floatingPrecision)) != 1) {
          console.log("ERROR not 1");
          return;
        }
      }
      setKeyProbabilityTable(keyProbabilitiesUpdatedTable);
      setOptimalWalletProb(0);
      setOptimalWallet([]);
    }
    else {
      setKeyProbabilitiesUpdatedTable(keyProbabilityTable);
    }

    setIsEditingProbabilities(!isEditingProbabilities);
  }

  function toPercent(probability) {
    return parseFloat((probability * 100).toFixed(floatingPrecision)).toString() + ' %';
  }

  function duplicateKey(index) {
    keyProbabilityTable.safe.push(keyProbabilityTable.safe[index]);
    keyProbabilityTable.leaked.push(keyProbabilityTable.leaked[index]);
    keyProbabilityTable.lost.push(keyProbabilityTable.lost[index]);
    keyProbabilityTable.stolen.push(keyProbabilityTable.stolen[index]);

    setKeyProbabilityTable(keyProbabilityTable);
    setKeyNum(keyNum + 1);
    setOptimalWalletProb(0);
    setOptimalWallet([]);
  }

  function removeKey(index) {
    if (keyNum == 1) {
      return;
    }
    for (const keyState in keyProbabilityTable) {
      if (Object.hasOwnProperty.call(keyProbabilityTable, keyState)) {
        keyProbabilityTable[keyState] = keyProbabilityTable[keyState].slice(0, index).concat(keyProbabilityTable[keyState].slice(index + 1, keyNum));
      }
    }
    setKeyProbabilityTable(keyProbabilityTable);
    setKeyNum(keyNum - 1);
    setWallet([]);
    setSelectedKeyForCombination(-1);
    setCombinationToAdd([]);
    setOptimalWalletProb(0);
    setOptimalWallet([]);
  }

  function addKey() {
    keyProbabilityTable.safe.push(keyProbabilityTable.safe[keyNum - 1]);
    keyProbabilityTable.leaked.push(keyProbabilityTable.leaked[keyNum - 1]);
    keyProbabilityTable.lost.push(keyProbabilityTable.lost[keyNum - 1]);
    keyProbabilityTable.stolen.push(keyProbabilityTable.stolen[keyNum - 1]);

    setKeyProbabilityTable(keyProbabilityTable);
    setKeyNum(keyNum + 1);
    setOptimalWalletProb(0);
    setOptimalWallet([]);
  }

  function renderKeyProbInputRow(index) {
    if (isEditingProbabilities) {
      return (
        <tr key={index} style={{ textAlign: 'center' }}>
          <td></td>
          <td>{index + 1}</td>
          <td><input type="number" defaultValue={keyProbabilityTable.safe[index] * 100} onChange={(event) => updateKeyProbabilities('safe', index, parseFloat(event.target.value))} /> %</td>
          <td><input type="number" defaultValue={keyProbabilityTable.leaked[index] * 100} onChange={(event) => updateKeyProbabilities('leaked', index, parseFloat(event.target.value))} /> %</td>
          <td><input type="number" defaultValue={keyProbabilityTable.lost[index] * 100} onChange={(event) => updateKeyProbabilities('lost', index, parseFloat(event.target.value))} /> %</td>
          <td><input type="number" defaultValue={keyProbabilityTable.stolen[index] * 100} onChange={(event) => updateKeyProbabilities('stolen', index, parseFloat(event.target.value))} /> %</td>
        </tr>
      );
    }
    else {
      return (
        <tr key={index} style={{ textAlign: 'center' }}>
          <td style={{ alignItems: 'center' }}><Button size='sm' onClick={() => removeKey(index)}>-</Button><Button style={{ marginLeft: '10px' }} size='sm' onClick={() => duplicateKey(index)}>copy</Button></td>
          <td>{index + 1}</td>
          <td>{toPercent(keyProbabilityTable.safe[index])}</td>
          <td>{toPercent(keyProbabilityTable.leaked[index])}</td>
          <td>{toPercent(keyProbabilityTable.lost[index])}</td>
          <td>{toPercent(keyProbabilityTable.stolen[index])}</td>
        </tr>
      );
    }
  }

  function updateKeyNum(number) {
    if (number < 1) {
      return;
    }
    if (number < keyProbabilityTable.safe.length) {
      for (const keyState in keyProbabilityTable) {
        if (Object.hasOwnProperty.call(keyProbabilityTable, keyState)) {
          keyProbabilityTable[keyState] = keyProbabilityTable[keyState].slice(0, -1);
        }
      }
      setWallet([]);
      setSelectedKeyForCombination(-1);
      setCombinationToAdd([]);
    }
    else {
      for (let i = 0; i < (number - keyProbabilityTable.safe.length); i++) {
        keyProbabilityTable.safe.push(0.7);
        keyProbabilityTable.leaked.push(0.05);
        keyProbabilityTable.lost.push(0.15);
        keyProbabilityTable.stolen.push(0.1);
      }
    }
    setKeyProbabilityTable(keyProbabilityTable);
    setKeyNum(number);
  }

  function ownerSuccessForScenarioAndWallet(walletArr, scenario) {
    for (let combination of walletArr) {
      let combinationPassed = true;
      for (let keyIndex of combination) {
        let keyState = keyStates[parseInt(scenario[keyIndex])];
        if (keyState == 'lost' || keyState == 'stolen') {
          combinationPassed = false;
          break;
        }
      }

      if (combinationPassed === true) {
        return true;
      }
    }
    return false;
  }

  function adversaryFailureForScenarioAndWallet(walletArr, scenario) {
    for (let combination of walletArr) {
      let combinationPassed = true;
      for (let keyIndex of combination) {
        let keyState = keyStates[parseInt(scenario[keyIndex])];
        if (keyState == 'lost' || keyState == 'safe') {
          combinationPassed = false;
          break;
        }
      }

      if (combinationPassed === true) {
        return false;
      }
    }
    return true;
  }

  function scenarioProbability(scenario) {
    let scenarioProb = 1;
    for (let i = 0; i < scenario.length; i++) {
      scenarioProb *= keyProbabilityTable[keyStates[parseInt(scenario[i])]][i];
    }
    return scenarioProb;
  }

  function computeProbabilityForWallet(walletArr) {
    let walletSuccessProb = 0;

    // Ahead lies some base 4 magic to enumerate all scenarios
    for (let i = 0; i < 4 ** keyNum; i++) {
      let scenario = i.toString(4);
      scenario = scenario.padStart(keyNum, '0');
      if (ownerSuccessForScenarioAndWallet(walletArr, scenario) && adversaryFailureForScenarioAndWallet(walletArr, scenario)) {
        walletSuccessProb += scenarioProbability(scenario);
      }
    }

    return walletSuccessProb;
  }

  function displayWallet(walletArr) {
    let walletString = "";
    if (walletArr.length == 0 || walletArr[0].length == 0) {
      return "( )";
    }
    for (let combination of walletArr) {
      walletString += " ( ";
      for (let keyIndex of combination) {
        walletString += (keyIndex + 1).toString() + " and ";
      }
      walletString = walletString.slice(0, -4);
      walletString += " ) ";
      walletString += " or ";
    }
    walletString = walletString.slice(0, -3);
    return walletString;
  }

  function combinationCoveredInWallet(wallet, newCombination) {
    for (let combination of wallet) {
      if (combination & newCombination == combination) {
        return true;
      }
    }

    return false;
  }

  function convertBinaryWalletToWallet(binWallet) {
    let wallet = [];
    for (let binComb of binWallet) {
      let combination = [];
      for (let i = 0; i < keyNum; i++) {
        if ((binComb & (1 << i)) > 0) {
          combination.push(i);
        }
      }
      if (combination.length > 0) {
        wallet.push(combination);
      }
    }

    return wallet;
  }

  function enumerateWalletProbabilities(baseWallet, prevCombination) {
    for (let curCombination = prevCombination + 1; curCombination < 2 ** keyNum; curCombination++) {
      if (!combinationCoveredInWallet(baseWallet, curCombination)) {
        let curWallet = [curCombination].concat(baseWallet);
        let convertedWallet = convertBinaryWalletToWallet(curWallet);
        let walletProb = computeProbabilityForWallet(convertedWallet);
        if (walletProb > maxSuccessForWallet) {
          maxSuccessForWallet = walletProb;
          curOptimalWallet = convertedWallet;
        }

        enumerateWalletProbabilities(curWallet, curCombination);
      }
    }
  }

  function findOptimalWallet() {
    if (keyNum > 4) {
      return;
    }

    // recursively enumerate all wallets 
    enumerateWalletProbabilities([], 0);
    setOptimalWallet(curOptimalWallet);
    setOptimalWalletProb(maxSuccessForWallet);
  }

  function parseWalletFromString(walletStr) {
    let walletTokens = walletStr.split(' ');
    let lookForNumber = false;
    let lookForAnd = false;
    let lookForOr = false;
    let lookForCombinationStart = true;
    let lookForCombinationEnd = false;
    let newWallet = [];
    let combination = [];

    if (walletStr.length == 0) {
      setWallet([]);
    }

    for (let token of walletTokens) {
      if (lookForCombinationStart) {
        if (token != "(") {
          return;
        }
        lookForNumber = true;
        lookForCombinationStart = false;
        continue;
      }
      if (lookForNumber) {
        try {
          let keyIndex = parseInt(token) - 1;
          if (keyIndex >= keyNum) {
            return;
          }
          combination.push(keyIndex);
          lookForNumber = false;
          lookForAnd = true;
          lookForCombinationEnd = true;
          continue;
        } catch {
          return;
        }
      }
      if (lookForAnd || lookForCombinationEnd) {
        if (token == 'and') {
          lookForNumber = true;
          lookForCombinationEnd = false;
          lookForAnd = false;
          continue;
        }
        else if (token == ')') {
          reduceWallet(newWallet, combination);
          combination = [];
          lookForCombinationEnd = false;
          lookForOr = true;
          lookForAnd = false;
          continue;
        }
        else {
          return;
        }
      }
      if (lookForOr) {
        if (token == 'or') {
          lookForCombinationStart = true;
          lookForOr = false;
        }
        else {
          return;
        }
      }
    }

    if (lookForOr) {
      setWallet(newWallet);
      setSelectedKeyForCombination(-1);
      setCombinationToAdd([]);
    }
  }

  function addToCombination(event) {
    if (selectedKeyForCombination == -1) {
      return;
    }
    combinationToAdd.push(parseInt(selectedKeyForCombination));
    setCombinationToAdd(combinationToAdd);
    for (let i = 0; i < keyNum; i++) {
      if (!combinationToAdd.includes(i)) {
        setSelectedKeyForCombination(i);
        return;
      }
    }
    setSelectedKeyForCombination(-1);
  }

  function reduceWallet(curWallet, combination) {
    if (combination.length == 0) {
      return;
    }
    let combinationReduced = false;
    for (let i = 0; i < curWallet.length; i++) {
      if (combination.every(elem => curWallet[i].includes(elem))) {
        curWallet[i] = combination;
        combinationReduced = true;
        break;
      }
      else if (curWallet[i].every(elem => combination.includes(elem))) {
        combinationReduced = true;
        break;
      }
    }

    if (!combinationReduced) {
      curWallet.push(combination);
    }
  }

  function addCombinationToWallet(event) {
    reduceWallet(wallet, combinationToAdd);
    setWallet(wallet);
    setSelectedKeyForCombination(-1);
    setCombinationToAdd([]);
  }

  function displayCombinationEditor() {
    let displayCurrentState = "";
    for (let keyIndex of combinationToAdd) {
      displayCurrentState += (keyIndex + 1).toString() + " and ";
    }

    let options = [(<option value={-1}>{" "}</option>)];
    for (let i = 0; i < keyNum; i++) {
      if (!combinationToAdd.includes(i)) {
        options.push(<option value={i}>{i + 1}</option>);
      }
    }

    return (<div><div style={{ fontSize: '25px', fontWeight: 'bold', marginBottom: '5px', marginTop: '15px' }}>( {displayCurrentState}   )</div> <Form.Select size='sm' value={selectedKeyForCombination} onChange={(event) => setSelectedKeyForCombination(event.target.value)}>
      {options}
    </Form.Select> <Button style={{ marginTop: '20px', marginBottom: '5px' }} size='sm' onClick={addToCombination}>Add to combination</Button></div>)
  }

  let keyProbInputs = [];
  for (let i = 0; i < keyNum; i++) {
    keyProbInputs.push(renderKeyProbInputRow(i));
  }

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css"
        integrity="sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU"
        crossorigin="anonymous"
      />
      <h1 style={{ marginLeft: '100px', marginRight: '100px', marginTop: '20px', textAlign: 'center' }}>Crypto Wallet Success Calculator</h1>
      {/* <h2>How many keys?</h2>
      <input type="number" defaultValue={keyNum} onChange={(event) => updateKeyNum(parseInt(event.target.value))} />
      <p>Keys: {keyNum}</p> */}

      <Card style={{ marginLeft: '100px', marginRight: '100px', marginTop: '20px' }}>
        <Card.Body>
          <Card.Title style={{ fontSize: '28px' }}>Set Key Probabilities</Card.Title>
          <Button style={{ marginTop: '15px', marginBottom: '10px' }} size='sm' onClick={toggleEditingMode}>{isEditingProbabilities ? "Submit changes" : "Edit key probabilities"}</Button>
          <Table striped bordered hover id='keyProbabilities'>
            <tbody>
              <tr>{renderTableHeader()}</tr>
              {keyProbInputs}
            </tbody>
          </Table>
          <Button size='sm' onClick={addKey}>+</Button>
        </Card.Body>
      </Card>

      <Card style={{ marginLeft: '100px', marginRight: '100px', marginTop: '20px' }}>
        <Card.Body>
          <Card.Title style={{ fontSize: '28px' }}>Set Wallet Configuration</Card.Title>
          {displayCombinationEditor()}

          <Button style={{ marginBottom: '5px' }} size='sm' onClick={addCombinationToWallet}>Add combination to wallet</Button><br />
          <Button style={{ marginBottom: '20px' }} size='sm' onClick={() => { setCombinationToAdd([]); setSelectedKeyForCombination(-1); }}>Clear combination</Button>

          <Card.Text style={{ fontSize: '25px' }}>(Optional) Enter Wallet as String</Card.Text>
          <Form.Control type="text" size='sm' onChange={(event) => parseWalletFromString(event.target.value)} />
        </Card.Body>
      </Card>

      <Card style={{ marginLeft: '100px', marginRight: '100px', marginTop: '20px', marginBottom: '20px' }}>
        <Card.Body>
          <Card.Title style={{ fontSize: '28px' }}>Wallet</Card.Title>
          <div style={{ fontSize: '25px', fontWeight: 'bold', marginTop: '15px', marginBottom: '10px' }}>{displayWallet(wallet)}</div>
          <Button style={{ marginBottom: '20px' }} size='sm' onClick={() => { setWallet([]) }}>Clear Wallet</Button>

          <div style={{ fontSize: '25px' }}>Wallet Success Probability</div>
          <div style={{ fontSize: '25px', marginBottom: '20px' }}>{toPercent(computeProbabilityForWallet(wallet))}</div>

          <div style={{ fontSize: '25px', marginBottom: '10px' }}>Optimal Wallet</div>
          <Button style={{ marginBottom: '10px' }} size='sm' onClick={() => { setOptimalWallet([]); setOptimalWalletProb(0); findOptimalWallet(); }}>Compute optimal wallet</Button>
          <div style={{ fontSize: '25px', fontWeight: 'bold' }}>{displayWallet(optimalWallet)}</div>
          <div style={{ fontSize: '25px' }}>{toPercent(optimalWalletProb)}</div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default App;