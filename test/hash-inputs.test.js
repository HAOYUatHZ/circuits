const fs = require("fs");
const path = require("path");
const tester = require("circom").tester;
const Scalar = require("ffjavascript").Scalar;
const SMTMemDB = require("circomlib").SMTMemDB;

const RollupDB = require("@hermeznetwork/commonjs").RollupDB;
const Account = require("@hermeznetwork/commonjs").HermezAccount;
const float16 = require("@hermeznetwork/commonjs").float16;

describe("Test hash-inputs", function () {
    this.timeout(0);
    let circuitPath = path.join(__dirname, "hash-inputs.test.circom");
    let circuit;

    let nLevels = 16;
    let nTx = 2;
    let maxL1Tx = 1;
    let maxFeeTx = 1;

    before( async() => {
        const circuitCode = `
            include "../src/hash-inputs.circom";
            component main = HashInputs(${nLevels}, ${nTx}, ${maxL1Tx}, ${maxFeeTx});
        `;

        fs.writeFileSync(circuitPath, circuitCode, "utf8");

        circuit = await tester(circuitPath, {reduceConstraints:false});
        await circuit.loadConstraints();
        console.log("Constraints: " + circuit.constraints.length + "\n");

        // const testerAux = require("circom").testerAux;
        // const pathTmp = "/tmp/circom_62663mheTW3S1eG5";
        // circuit = await testerAux(pathTmp, path.join(__dirname, "circuits", "hash-inputs.test.circom"));
    });

    after( async() => {
        fs.unlinkSync(circuitPath);
    });

    it("Should check empty hash inputs", async () => {
        const db = new SMTMemDB();
        const rollupDB = await RollupDB(db);
        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx);

        bb.totalFeeTransactions = 1;
        await bb.build();

        const L1TxsDataScalar = Scalar.fromString(bb.getL1TxsData(), 16);
        const L1TxsDataB = Scalar.bits(L1TxsDataScalar);
        while(L1TxsDataB.length < (maxL1Tx * bb.L1TxB)){
            L1TxsDataB.unshift(0);
        }

        const L2TxsDataScalar = Scalar.fromString(bb.getL2TxsData(), 16);
        const L2TxsDataB = Scalar.bits(L2TxsDataScalar);
        while(L2TxsDataB.length < (nTx * bb.L2TxB)){
            L2TxsDataB.unshift(0);
        }

        const input = {
            oldLastIdx: bb.getOldLastIdx(),
            newLastIdx: bb.getNewLastIdx(),
            oldStateRoot: bb.getOldStateRoot(),
            newStateRoot: bb.getNewStateRoot(),
            newExitRoot: bb.getNewExitRoot(),
            L1TxsData: L1TxsDataB,
            L2TxsData: L2TxsDataB,
            feeTxsData: bb.input.feeIdxs,
            globalChainID: bb.chainID,
        };

        const w = await circuit.calculateWitness(input, {logTrigger:false, logOutput: false, logSet: false});

        const checkOut = {
            hashInputsOut: bb.getHashInputs(),
        };

        await circuit.assertOut(w, checkOut);
    });

    it("Should check non-empty hash inputs", async () => {
        const db = new SMTMemDB();
        const rollupDB = await RollupDB(db);
        const bb = await rollupDB.buildBatch(nTx, nLevels, maxL1Tx);

        const account1 = new Account(1);

        bb.addTx({
            fromIdx: 0,
            loadAmountF: float16.fix2Float(1000),
            tokenID: 1,
            fromBjjCompressed: account1.bjjCompressed,
            fromEthAddr: account1.ethAddr,
            toIdx: 0,
            onChain: true
        });

        const tx = {
            fromIdx: 256,
            toIdx: 256,
            tokenID: 1,
            amount: Scalar.e(50),
            nonce: 0,
            userFee: 200, // effective fee is 4
        };

        account1.signTx(tx);
        bb.addTx(tx);

        bb.totalFeeTransactions = 1;
        await bb.build();

        const L1TxsDataScalar = Scalar.fromString(bb.getL1TxsData(), 16);
        const L1TxsDataB = Scalar.bits(L1TxsDataScalar).reverse();
        while(L1TxsDataB.length < (maxL1Tx * bb.L1TxB)){
            L1TxsDataB.unshift(0);
        }

        const L2TxsDataScalar = Scalar.fromString(bb.getL2TxsData(), 16);
        const L2TxsDataB = Scalar.bits(L2TxsDataScalar).reverse();
        while(L2TxsDataB.length < (nTx * bb.L2TxB)){
            L2TxsDataB.unshift(0);
        }

        const input = {
            oldLastIdx: bb.getOldLastIdx(),
            newLastIdx: bb.getNewLastIdx(),
            oldStateRoot: bb.getOldStateRoot(),
            newStateRoot: bb.getNewStateRoot(),
            newExitRoot: bb.getNewExitRoot(),
            L1TxsData: L1TxsDataB,
            L2TxsData: L2TxsDataB,
            feeTxsData: bb.input.feeIdxs,
            globalChainID: bb.chainID,
        };

        const w = await circuit.calculateWitness(input, {logTrigger:false, logOutput: false, logSet: false});

        const checkOut = {
            hashInputsOut: bb.getHashInputs(),
        };

        await circuit.assertOut(w, checkOut);
    });
});