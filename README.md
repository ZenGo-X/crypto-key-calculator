# Crypto-Wallet Designer
This app is a calculator that helps you analyze, given a certain crypto wallet key distribution setting, the probability of its failure.

Available online at: https://crypto-wallet-designer.github.io/crypto-key-calculator/

## Running the app locally
This is a simple react application.
In order to run node must be installed, then simply run:
```
npm run start
```
And a local instance will be hosted on your machine.

In order to build for production, run:
```
npm run build
```

Then, in the `docs` directory will be all the files needed to host the application.

To host the application locally run `python3 -m http.server` from the `docs` directory.

## Deploying
This repo is set up with Github Pages so that production builds of the app that are pushed to the `main` branch are automatically deployed to https://walletdesign.dev.

First, make sure to test newly added code using:
```
npm run start
```

Now, backup the `CNAME` file (for Github Pages):
```
mv docs/CNAME .
```

Build the app:
```
npm run build
```

Restore the `CNAME` file and add changes to git
```
mv CNAME docs/CNAME
cp LICENSE docs/LICENSE
git add docs
git commit -am "very cool new changes"
git push
```

That's it!

Wait a couple of minutes and the changes should be deployed to https://walletdesign.dev



## Compile the web worker (temporary fix):
Run this command to get the worker.js compiled by webpack in main.js:
```npx webpack-cli ./.\public\worker.js -o public```

# Compile cpp

`em++ --no-entry cpp_and_wasm_files/backend.cpp -o src/solver.mjs -s ENVIRONMENT='web' -s SINGLE_FILE=1 -s EXPORT_NAME='solverModule' -s USE_ES6_IMPORT_META=0 -s EXPORTED_FUNCTIONS="[\"_findWallet\"]" -s EXPORTED_RUNTIME_METHODS="[\"ccall\", \"cwrap\"]" -s TOTAL_MEMORY=268435456 -O3`