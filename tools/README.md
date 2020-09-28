# Build Rollup circuit

Rollup circuit needs two inputs:
- `nTx`: number maximum of transactions accepted by the circuit
- `nLevels`: balance tree levels ( 2^levels^ accounts would be possible to create )
- `maxL1Tx`: maximum number of L1 transactions
- `maxFeeTx`: maximum number of total fee transactions

This tool is intended to be used for:
- compile circuit
- create valid input
- compile witness in C
- compute witness

General command line:
  - `node cli.js "actions" "nTx" "nLevels" "maxL1Tx" "maxFeeTx"`

## Commands

### Create
- Creates folder and store circuit for `nTx` - `nLevels` - `maxL1Tx` - `maxFeeTx`:
  - folder: `rollup-nTx-nLevels-maxL1Tx-maxFeeTx`
  - circuit: `circuit-nTx-nLevels-maxL1Tx-maxFeeTx`

Example command: 
  - `node cli.js create 256 32 128 64`

### Compile circuit
- Compiles rollup circuit and store it into above folder:
  - `circuit-nTx-nLevels-maxL1Tx-maxFeeTx.r1cs`: circuit compiled
  - `circuit-nTx-nLevels-maxL1Tx-maxFeeTx.cpp`: calculate witness cpp

- Parameter added to choose components parallelization `RollupTx|DecodeTx`
  - Default value: not parellelize 

Example command: 
  - `node build-circuit.js compile 256 32 128 64 1`

### Inputs
- Creates and stores an empty input for circuit

Example command:
  - `node cli.js input 256 32 128 64`

### Compile witness
- compile cpp witness

Example command:
  - `node cli.js compilewitness 256 32 128 64`

### Compute witness
- computes witness given an input for the circuit

Example command:
  - `node cli.js witness 256 32 128 64`

# Estimate constraints
It computes the constraints for `rollup-main` circuit taking into account its parameters `nTx`, `nLevels`, `maxL1Tx` and `maxFeeTx`.

## Usage
General command line:
  - `node circuit-constraints.js "nTx" "nLevels" "maxL1Tx" "maxFeeTx"`

Example:
```
node circuit-constraints.js 512 32 256 64
```

# Populate Database and generate input
It creates a given number of accounts into rollup database. Afterwards, it creates a batch with a given number of L2 transactions and builds input to calculate the witness.

## Usage
General command line:
  - `node generate-input.js "nAccounts" "nTransactions"`

Example:
```
node generate-input.js 1024 32
```