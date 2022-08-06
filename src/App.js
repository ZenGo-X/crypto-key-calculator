import React, {useEffect, useState} from 'react';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import ZengoLogo from './assets/zengo_logo.svg';
import GitHubLogo from './assets/GitHub.png';
import 'bootstrap/dist/css/bootstrap.min.css';
import { isMobile } from 'react-device-detect';
import './App.css';
import { Col, Container, Row } from 'react-bootstrap';
import ContractModal from './components/ContractModal';
import solverModule from "./solver.mjs";

function App() {
  const [keyNum, setKeyNum] = useState(3);
  const [keyProbabilityTable, setKeyProbabilityTable] = useState({
    safe: [0.7, 0.7, 0.7],
    leaked: [0.05, 0.05, 0.05],
    lost: [0.15, 0.15, 0.15],
    stolen: [0.1, 0.1, 0.1]
  });
  const [wallet, setWallet] = useState([[0, 1], [1, 2]]);
  const keyStates = ['safe', 'leaked', 'lost', 'stolen'];
  const floatingPrecision = 8;
  const [combinationToAdd, setCombinationToAdd] = useState([]);
  const [optimalWalletString, setOptimalWalletString] = useState("()");
  const [rawOptimalWalletString, setRawOptimalWalletString] = useState("return k[0];");
  const [optimalWalletProb, setOptimalWalletProb] = useState(0);
  const [showProbabilitiesError, setShowProbabilitiesError] = useState(false);
  const [showWalletStrWithErrors, setShowWalletStrWithErrors] = useState(false);
  const [showCantComputeOptimalWallet, setShowCantComputeOptimalWallet] = useState(false);
  const [showWalletReduced, setShowWalletReduced] = useState(false);
  const [showSetKeysInfo, setShowSetKeysInfo] = useState(true);
  const [showWarningMobile, setShowWarningMobile] = useState(isMobile);
  const [findWallet, setFindWallet] = useState();
  const marginHorizontalPx = isMobile ? '5px' : '100px';
  const minusButtonBottomMarginPx = isMobile ? '2px' : '0px';
  const copyKeyMarginLeftPx = isMobile ? '0px' : '10px';

  useEffect(
      () => {
        solverModule().then((Module) => {
          setFindWallet(() => Module.cwrap("findWallet", "string", ["number", "array"]));
        });
      }, []);

  function renderTableHeader() {
    let header = ["Key ID"].concat(Object.keys(keyProbabilityTable)).concat([" ",]);
    return header.map((key, index) => {
      return <th key={index}>{key.toUpperCase()}</th>
    });
  }

  function updateKeyProbabilities(state, index, percent) {
    let newProbabilityTable = {
      ...keyProbabilityTable
    };

    if (!percent) {
      newProbabilityTable[state][index] = -1;
    } else {
      let probabilitiesSum = 0;

      for (let stateIter of keyStates) {
        if (stateIter !== 'safe' && stateIter !== state) {
          probabilitiesSum += keyProbabilityTable[stateIter][index];
        }
      }

      probabilitiesSum += percent / 100;
      probabilitiesSum = parseFloat(probabilitiesSum.toFixed(floatingPrecision));

      newProbabilityTable[state][index] = percent / 100;
      newProbabilityTable['safe'][index] = 1 - probabilitiesSum;
    }

    setKeyProbabilityTable(newProbabilityTable);
  }

  function probabilityToDisplayValue(probability) {
    if (probability >= 0) {
      return parseFloat(probability).toFixed(0);
    } else {
      return "";
    }
  }

  function toPercent(probability) {
    return parseFloat((probability * 100).toFixed(floatingPrecision)).toString() + ' %';
  }

  function duplicateKey(index) {
    for (const keyState in keyProbabilityTable) {
      if (Object.hasOwnProperty.call(keyProbabilityTable, keyState)) {
        keyProbabilityTable[keyState] = keyProbabilityTable[keyState].concat([keyProbabilityTable[keyState][index]]);
      }
    }

    if (keyNum + 1 <= 3) {
      findOptimalWallet(keyNum + 1);
    }
    else {
      setOptimalWalletProb(0);
      setOptimalWalletString("()");
    }
    setKeyProbabilityTable(keyProbabilityTable);
    setKeyNum(keyNum + 1);
  }

  function removeKey(index) {
    if (keyNum === 1) {
      return;
    }
    for (const keyState in keyProbabilityTable) {
      if (Object.hasOwnProperty.call(keyProbabilityTable, keyState)) {
        keyProbabilityTable[keyState] = keyProbabilityTable[keyState].slice(0, index).concat(keyProbabilityTable[keyState].slice(index + 1, keyNum));
      }
    }

    if (keyNum - 1 <= 3) {
      findOptimalWallet(keyNum - 1);
    }
    else {
      setOptimalWalletProb(0);
      setOptimalWalletString("()");
    }

    setKeyProbabilityTable(keyProbabilityTable);
    setKeyNum(keyNum - 1);
    setWallet([]);
    setCombinationToAdd([]);
  }

  function renderKeyProbInputRow(index) {
    return (
      <tr key={index} style={{ textAlign: 'center' }}>
        <td><Button variant="dark-lavender" style={{ marginRight: '5px' }}>{index + 1}</Button></td>
        <td><input type="number" disabled value={probabilityToDisplayValue(keyProbabilityTable.safe[index] * 100)} /> %</td>
        <td><input type="number" value={probabilityToDisplayValue(keyProbabilityTable.leaked[index] * 100)} onChange={(event) => updateKeyProbabilities('leaked', index, event.target.value)} /> %</td>
        <td><input type="number" value={probabilityToDisplayValue(keyProbabilityTable.lost[index] * 100)} onChange={(event) => updateKeyProbabilities('lost', index, event.target.value)} /> %</td>
        <td><input type="number" value={probabilityToDisplayValue(keyProbabilityTable.stolen[index] * 100)} onChange={(event) => updateKeyProbabilities('stolen', index, event.target.value)} /> %</td>
        <td style={{ alignItems: 'center' }}>
          <Button variant='minty' size='sm' style={{ marginBottom: minusButtonBottomMarginPx }} onClick={() => { removeKey(index); }}>DEL</Button>
          <Button style={{ marginLeft: copyKeyMarginLeftPx }} size='sm' variant='minty' onClick={() => { duplicateKey(index); }}>DUP</Button>
        </td>
      </tr>
    );
  }

  function ownerSuccessForScenarioAndWallet(walletArr, scenario) {
    for (let combination of walletArr) {
      let combinationPassed = true;
      for (let keyIndex of combination) {
        let keyState = keyStates[parseInt(scenario[keyIndex])];
        if (keyState === 'lost' || keyState === 'stolen') {
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
        if (keyState === 'lost' || keyState === 'safe') {
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

  function computeProbabilityForWallet(walletArr, keyNumber) {
    let walletSuccessProb = 0;

    // Ahead lies some base 4 magic to enumerate all scenarios
    for (let i = 0; i < 4 ** keyNumber; i++) {
      let scenario = i.toString(4);
      scenario = scenario.padStart(keyNumber, '0');
      if (ownerSuccessForScenarioAndWallet(walletArr, scenario) && adversaryFailureForScenarioAndWallet(walletArr, scenario)) {
        walletSuccessProb += scenarioProbability(scenario);
      }
    }

    return walletSuccessProb;
  }

  function displayWallet(walletArr) {
    let walletString = "";
    if (walletArr.length === 0 || walletArr[0].length === 0) {
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

  function findOptimalWallet(keyNumber) {
    if (keyNumber > 6) {
      setShowCantComputeOptimalWallet(true);
      return;
    }

    let probabilityArray = [];

    for (let i = 0; i < keyNumber; i++)
    {
      for (let j = 0; j < keyStates.length; j++)
      {
        probabilityArray.push(keyProbabilityTable[keyStates[j]][i]*100);
      }
    }

    let probability = -1;
    let optimalWalletString = "()"
    let optimalWallet = "return k[0]";

    if(findWallet) {
      const passArray = new Uint8Array(new Float64Array(probabilityArray).buffer)
      optimalWallet = findWallet(keyNumber, passArray);
      const trimmedOptimalWallet = optimalWallet.replace("return ", "");
      optimalWalletString = trimmedOptimalWallet.split(";")[0]
        .replaceAll("&&", "and")
        .replaceAll("||", "or")
        .replaceAll("k[", "")
        .replaceAll("]", "");
      probability = parseFloat(trimmedOptimalWallet.split(";")[1].replace(",", ""));
    }

    setRawOptimalWalletString(optimalWallet);
    setOptimalWalletString(optimalWalletString);
    setOptimalWalletProb(probability);
  }

  function parseWalletFromString(walletStr) {
    let lookForNumber = false;
    let lookForAnd = false;
    let lookForOr = false;
    let lookForCombinationStart = true;
    let lookForCombinationEnd = false;
    let newWallet = [];
    let combination = [];

    if (walletStr.length === 0) {
      setShowWalletStrWithErrors(false);
      setWallet([]);
    }

    // normalize entered string
    walletStr = walletStr
      .toLowerCase()
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/and/g, ' and ')
      .replace(/or/g, ' or ')
      .replace(/[\s]+/g, ' ')
      .trim();
    let walletTokens = walletStr.split(' ');

    for (let token of walletTokens) {
      if (lookForCombinationStart) {
        if (token !== "(") {
          setShowWalletStrWithErrors(true);
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
            setShowWalletStrWithErrors(true);
            return;
          }
          combination.push(keyIndex);
          lookForNumber = false;
          lookForAnd = true;
          lookForCombinationEnd = true;
          continue;
        } catch {
          setShowWalletStrWithErrors(true);
          return;
        }
      }
      if (lookForAnd || lookForCombinationEnd) {
        if (token === 'and') {
          lookForNumber = true;
          lookForCombinationEnd = false;
          lookForAnd = false;
          continue;
        }
        else if (token === ')') {
          reduceWallet(newWallet, combination);
          combination = [];
          lookForCombinationEnd = false;
          lookForOr = true;
          lookForAnd = false;
          continue;
        }
        else {
          setShowWalletStrWithErrors(true);
          return;
        }
      }
      if (lookForOr) {
        if (token === 'or') {
          lookForCombinationStart = true;
          lookForOr = false;
        }
        else {
          setShowWalletStrWithErrors(true);
          return;
        }
      }
    }

    if (lookForOr) {
      setWallet(newWallet);
      setCombinationToAdd([]);
      setShowWalletStrWithErrors(false);
    }
    else {
      setShowWalletStrWithErrors(true);
    }
  }

  function addToCombination(keyToAdd) {
    const newCombinationToAdd = [...combinationToAdd, keyToAdd];
    setCombinationToAdd(newCombinationToAdd);
  }

  function reduceWallet(curWallet, combination) {
    if (combination.length === 0) {
      return;
    }
    let combinationReduced = false;
    for (let i = 0; i < curWallet.length; i++) {
      if (combination.every(elem => curWallet[i].includes(elem))) {
        curWallet[i] = combination;
        combinationReduced = true;
        setShowWalletReduced(true);
        break;
      }

      else if (curWallet[i].every(elem => combination.includes(elem))) {
        combinationReduced = true;
        setShowWalletReduced(true);
        break;
      }
    }

    if (!combinationReduced) {
      setShowWalletReduced(false);
      curWallet.push(combination);
    }
  }

  function addCombinationToWallet(event) {
    reduceWallet(wallet, combinationToAdd);
    setWallet(wallet);
    setCombinationToAdd([]);
  }

  function displayCombinationEditor() {
    let displayCurrentState = "";
    for (let keyIndex of combinationToAdd) {
      displayCurrentState += (keyIndex + 1).toString() + " and ";
    }
    displayCurrentState = displayCurrentState.slice(0, -5);

    let buttons = [];
    for (let i = 0; i < keyNum; i++) {
      if (!combinationToAdd.includes(i)) {
        buttons.push(<Button variant="dark-lavender" style={{ marginRight: '5px' }} onClick={(event) => addToCombination(i)}>{i + 1}</Button>);
      }
    }

    return (<div><div style={{ fontSize: '25px', fontWeight: 'bold', marginBottom: '5px', marginTop: '15px' }}>( {displayCurrentState}   )</div>
      <div style={{ marginBottom: '15px' }}>{buttons}</div></div>)
  }

  let keyProbInputs = [];
  for (let i = 0; i < keyNum; i++) {
    keyProbInputs.push(renderKeyProbInputRow(i));
  }

  let alertProbabilitiesError = <div></div>;
  if (showProbabilitiesError) {
    alertProbabilitiesError = <Alert variant="danger" onClose={() => setShowProbabilitiesError(false)} dismissible>Failure percentages must add up to 100 %</Alert>;
  }

  let alertWalletStrWithErrors = <div></div>;
  if (showWalletStrWithErrors) {
    alertWalletStrWithErrors = <Alert variant="danger" onClose={() => setShowWalletStrWithErrors(false)} dismissible>Could not parse entered wallet. (Try creating a wallet using the key buttons above first to see the correct wallet format)</Alert>
  }

  let alertCantComputeOptimalWallet = <div></div>;
  if (showCantComputeOptimalWallet) {
    alertCantComputeOptimalWallet = <Alert variant="danger" onClose={() => setShowCantComputeOptimalWallet(false)} dismissible>Computing optimal wallet is only available up to 4 keys</Alert>;
  }

  let warnWalletReduced = <div></div>;
  if (showWalletReduced) {
    warnWalletReduced = <Alert variant="warning" onClose={() => setShowWalletReduced(false)} dismissible>The last key combination added caused the wallet to reduced, meaning reduntant key combinations have been removed since they have no effect on wallet security.</Alert>;
  }

  let warningMobile = <div></div>;
  if (showWarningMobile) {
    warningMobile = <Alert variant="warning" onClose={() => setShowWarningMobile(false)} dismissible><Alert.Heading>You are viewing this page on mobile!</Alert.Heading> <p>For a better experience view either on desktop or in landscape mode.</p></Alert>;
  }

  document.body.style.backgroundColor = '#DFF0EF';

  let disclaimerCardRow = <div></div>;
  if (showSetKeysInfo) {
    disclaimerCardRow = <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
      <Col>
        <Card style={{ marginTop: '10px' }}>
          <Card.Body>
            <Alert style={{ marginBottom: '0px' }} variant="lavender" onClose={() => setShowSetKeysInfo(false)} dismissible>
              Compute the success rate of a crypto wallet based on the fault probabilities of its keys. <br />
              A wallet is successful if the owner can use it but an adversary can't.<br />
              More details <a href="https://ittayeyal.github.io/2021-11-16-keyManagement/" style={{ color: '#E6E9FB' }}>here</a>.
              White paper <a href="https://eprint.iacr.org/2021/1522.pdf" style={{ color: '#E6E9FB' }}>here</a>.
              No warranty; <a href="LICENSE" style={{ color: '#E6E9FB' }}>BSD license</a>.
            </Alert>
          </Card.Body>
        </Card>
      </Col>
    </Row>;
  }

  let keyConfCard = (<Card style={{ marginTop: '20px' }}>
    <Card.Body>
      <Card.Title style={{ fontSize: '28px' }}>1. Set Key Probabilities</Card.Title>

      {warningMobile}

      <style type="text/css">
        {`
      .btn-minty {
        color: #fff;
        background-color: #23A79D;
        border-color: #23A79D;
      }

      .btn-dark-lavender {
        color: #fff;
        background-color: #4C579B;
        border-color: #4C579B;
      }

      .alert-lavender {
        color: #fff;
        background-color: #7E88C7;
      }
      `}
      </style>
      <Table striped bordered hover responsive id='keyProbabilities' style={{ marginTop: '15px' }}>
        <tbody>
          <tr>{renderTableHeader()}</tr>
          {keyProbInputs}
        </tbody>
      </Table>
      {alertProbabilitiesError}
    </Card.Body>
  </Card>);

  let walletConfCard = (<Card style={{ marginTop: '20px', height: '91.5%' }}>
    <Card.Body>
      <Card.Title style={{ fontSize: '28px' }}>2. Set Wallet Configuration</Card.Title>
      <Card.Text style={{ fontSize: '15px', color: 'gray' }}>Choose keys then click "Add combination to wallet".</Card.Text>
      {displayCombinationEditor()}

      <Button style={{ marginBottom: '5px' }} variant='minty' size='sm' onClick={addCombinationToWallet}>Add combination to wallet</Button>
      <br />
      <Button style={{ marginBottom: '20px' }} variant='minty' size='sm' onClick={() => { setCombinationToAdd([]) }}>Clear combination</Button>

      <Card.Text style={{ fontSize: '25px' }}>Or enter Wallet as String</Card.Text>
      <Form.Control type="text" size='sm' placeholder='(1 and 2) or (2 and 3)' onChange={(event) => parseWalletFromString(event.target.value)} />
      {alertWalletStrWithErrors}
    </Card.Body>
  </Card>);

  let walletCard = (<Card style={{ marginTop: '20px', marginBottom: '20px', minHeight: 'parent' }}>
    <Card.Body>
      <Card.Title style={{ fontSize: '28px' }}>3. Wallet &nbsp;
        <Button style={{ marginBottom: '5px' }} variant='minty' size='sm' onClick={() => { setWallet([]) }}>Clear</Button>
      </Card.Title>
      <div style={{ fontSize: '25px', fontWeight: 'bold', marginTop: '15px', marginBottom: '10px' }}>{displayWallet(wallet)}</div>
      {warnWalletReduced}

      <div style={{ fontSize: '25px' }}>Success Probability: {toPercent(computeProbabilityForWallet(wallet, keyNum))}</div>
      <ContractModal keyNum={keyNum} optimalWalletString={rawOptimalWalletString}></ContractModal>
    </Card.Body>
  </Card>);

  let optimalWalletCard = (<Card style={{ marginBottom: '20px' }}>
    <Card.Body>
      <Card.Title style={{ fontSize: '28px' }}>Optimal Wallet &nbsp;
        <Button style={{ marginBottom: '5px' }} variant='minty' size='sm' onClick={() => { setOptimalWalletString("()"); setOptimalWalletProb(0); findOptimalWallet(keyNum); }}>
          Compute
        </Button>
        {alertCantComputeOptimalWallet}
      </Card.Title>
      <div style={{ fontSize: '25px', fontWeight: 'bold' }}>{optimalWalletString}</div>
      <div style={{ fontSize: '25px' }}>Success Probability: {toPercent(optimalWalletProb)}</div>
      <ContractModal keyNum={keyNum} optimalWalletString={rawOptimalWalletString}></ContractModal>
    </Card.Body>
  </Card>);

  let cardsContainer = <div></div>;
  if (!isMobile) {
    cardsContainer = <Container fluid>
      {disclaimerCardRow}
      <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
        <Col>{keyConfCard}</Col>
      </Row>
      <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
        <Col>{walletConfCard}</Col>
        <Col>
          <Row >
            <Col>{walletCard}</Col>
          </Row>
          <Row >
            <Col>{optimalWalletCard}</Col>
          </Row>
        </Col>
      </Row>
    </Container>;
  }
  else {
    cardsContainer = <Container fluid>
      {disclaimerCardRow}
      <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
        <Col>{keyConfCard}</Col>
      </Row>
      <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
        <Col>{walletConfCard}</Col>
      </Row>
      <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
        <Col>{walletCard}</Col>
      </Row>
      <Row style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx }}>
        <Col>{optimalWalletCard}</Col>
      </Row>
    </Container>;
  }

  return (
    <div style={{ backgroundColor: '#DFF0EF', fontFamily: 'AvenirNext-Medium' }}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css"
        integrity="sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU"
        crossOrigin="anonymous"
      />

      <h1 style={{ marginLeft: marginHorizontalPx, marginRight: marginHorizontalPx, marginTop: '20px', textAlign: 'center', color: '#2C2F33' }}>Crypto-Wallet Designer (pre-alpha)</h1>

      {cardsContainer}

      <p style={{ textAlign: 'right', marginRight: marginHorizontalPx, marginBottom: '0px', marginTop:'7px' }}>powered by <a href="https://zengo.com/"><img src={ZengoLogo} style={{ height: '6vmin' }} alt="ZenGo" /></a></p>
      <p style={{ textAlign: 'right', marginRight: marginHorizontalPx }}>code on <a href="https://github.com/ZenGo-X/crypto-key-calculator"><img src={GitHubLogo} style={{ height: '2vmin', marginLeft: '5px' }} alt="Github" /></a></p>
    </div>
  );
}

export default App;
