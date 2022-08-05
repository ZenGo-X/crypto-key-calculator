/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
importScripts(['https://solc-bin.ethereum.org/emscripten-wasm32/solc-emscripten-wasm32-latest.js'])

let compile = Module.cwrap('solidity_compile', 'string', ['string', 'number', 'number']);

addEventListener('message', (event) => {
    postMessage(compile(event.data, 0, 0));
});