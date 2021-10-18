import React, { useState } from 'react';
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
  const [combinationToAdd, setCombinationToAdd] = useState([]);
  const [selectedKeyForCombination, setSelectedKeyForCombination] = useState(-1);
  const [isEditingProbabilities, setIsEditingProbabilities] = useState(false);

  function renderTableHeader() {
    let header = [" "].concat(Object.keys(keyProbabilityTable));
    return header.map((key, index) => {
      return <th key={index}>{key.toUpperCase()}</th>
    });
  }

  function updateKeyProbabilities(state, index, probability) {
    keyProbabilitiesUpdatedTable[state][index] = probability;
    setKeyProbabilitiesUpdatedTable(keyProbabilitiesUpdatedTable);
  }

  function toggleEditingMode() {
    if (isEditingProbabilities) {
      for (let i = 0; i < keyNum; i++) {
        if (parseFloat((keyProbabilitiesUpdatedTable.safe[i] + keyProbabilitiesUpdatedTable.leaked[i] + keyProbabilitiesUpdatedTable.lost[i] + keyProbabilitiesUpdatedTable.stolen[i]).toFixed(8)) != 1) {
          console.log("ERROR not 1");
          return;
        }
      }
      setKeyProbabilityTable(keyProbabilitiesUpdatedTable);
    }
    else {
      setKeyProbabilitiesUpdatedTable(keyProbabilityTable);
    }

    setIsEditingProbabilities(!isEditingProbabilities);
  }

  function renderKeyProbInputRow(index) {
    if (isEditingProbabilities) {
      return (
        <tr key={index}>
          <td>{index}</td>
          <td><input type="number" defaultValue={keyProbabilityTable.safe[index]} onChange={(event) => updateKeyProbabilities('safe', index, parseFloat(event.target.value))} /></td>
          <td><input type="number" defaultValue={keyProbabilityTable.leaked[index]} onChange={(event) => updateKeyProbabilities('leaked', index, parseFloat(event.target.value))} /></td>
          <td><input type="number" defaultValue={keyProbabilityTable.lost[index]} onChange={(event) => updateKeyProbabilities('lost', index, parseFloat(event.target.value))} /></td>
          <td><input type="number" defaultValue={keyProbabilityTable.stolen[index]} onChange={(event) => updateKeyProbabilities('stolen', index, parseFloat(event.target.value))} /></td>
        </tr>
      );
    }
    else {
      return (
        <tr key={index}>
          <td>{index}</td>
          <td>{keyProbabilityTable.safe[index]}</td>
          <td>{keyProbabilityTable.leaked[index]}</td>
          <td>{keyProbabilityTable.lost[index]}</td>
          <td>{keyProbabilityTable.stolen[index]}</td>
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

  function ownerSuccessForScenarioAndWallet(scenario) {
    for (let combination of wallet) {
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

  function adversaryFailureForScenarioAndWallet(scenario) {
    for (let combination of wallet) {
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

  function computeProbabilityForWallet() {
    let walletSuccessProb = 0;

    // Ahead lies some base 4 magic to enumerate all scenarios
    for (let i = 0; i < 4 ** keyNum; i++) {
      let scenario = i.toString(4);
      scenario = scenario.padStart(keyNum, '0');
      if (ownerSuccessForScenarioAndWallet(scenario) && adversaryFailureForScenarioAndWallet(scenario)) {
        walletSuccessProb += scenarioProbability(scenario);
      }
    }

    return parseFloat(walletSuccessProb.toFixed(8));
  }

  function displayWallet() {
    let walletString = "";
    if (wallet.length == 0 || wallet[0].length == 0) {
      return "( )";
    }
    for (let combination of wallet) {
      walletString += " ( ";
      for (let keyIndex of combination) {
        walletString += keyIndex.toString() + " & ";
      }
      walletString = walletString.slice(0, -2);
      walletString += " ) ";
      walletString += " | ";
    }
    walletString = walletString.slice(0, -2);
    return walletString;
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

  function addCombinationToWallet(event) {
    if (combinationToAdd.length == 0) {
      return;
    }
    let combinationReduced = false;
    for (let i = 0; i < wallet.length; i++) {
      if (combinationToAdd.every(elem => wallet[i].includes(elem))) {
        wallet[i] = combinationToAdd;
        combinationReduced = true;
        break;
      }
      else if (wallet[i].every(elem => combinationToAdd.includes(elem))) {
        combinationReduced = true;
        break;
      }
    }

    if (!combinationReduced) {
      wallet.push(combinationToAdd);
    }
    setWallet(wallet);
    setSelectedKeyForCombination(-1);
    setCombinationToAdd([]);
  }

  function displayCombinationEditor() {
    let displayCurrentState = "";
    for (let keyIndex of combinationToAdd) {
      displayCurrentState += keyIndex.toString() + " & ";
    }

    let options = [(<option value={-1}>{" "}</option>)];
    for (let i = 0; i < keyNum; i++) {
      if (!combinationToAdd.includes(i)) {
        options.push(<option value={i}>{i}</option>);
      }
    }

    return (<div><h4>( {displayCurrentState}  <select value={selectedKeyForCombination} onChange={(event) => setSelectedKeyForCombination(event.target.value)}>
      {options}
    </select> )</h4> <button onClick={addToCombination}>Add to combination</button></div>)
  }

  let keyProbInputs = [];
  for (let i = 0; i < keyNum; i++) {
    keyProbInputs.push(renderKeyProbInputRow(i));
  }

  return (
    <div>
      <h1>Configure Keys</h1>
      <h2>How many keys?</h2>
      <input type="number" defaultValue={1} onChange={(event) => updateKeyNum(parseInt(event.target.value))} />
      <p>Keys: {keyNum}</p>

      <h2>Set Key Probabilities</h2>
      <button onClick={toggleEditingMode}>{isEditingProbabilities ? "Submit changes" : "Edit key probabilities"}</button>
      <table id='keyProbabilities'>
        <tbody>
          <tr>{renderTableHeader()}</tr>
          {keyProbInputs}
        </tbody>
      </table>

      <h2>Set Wallet Configuration</h2>
      {displayCombinationEditor()}

      <button onClick={addCombinationToWallet}>Add combination to wallet</button><br />
      <button onClick={() => { setCombinationToAdd([]); setSelectedKeyForCombination(-1); }}>Clear combination</button>
      <h2>Wallet</h2>
      <h3>{displayWallet()}</h3>
      <button onClick={() => { setWallet([]) }}>Clear Wallet</button>
      <h2>Wallet Success Probability</h2>
      <h3>{computeProbabilityForWallet()}</h3>

    </div>
  );
}

export default App;