import dotenv from 'dotenv';
import algosdk from 'algosdk';
import { open, readFile } from "node:fs/promises";
import { getAccount } from "./components/config.js";
dotenv.config();

const algodToken = "a".repeat(64);

const algodClient = new algosdk.Algodv2(algodToken, "http://localhost", "4001"); 

let myaccount = getAccount();
let sender = myaccount.addr.toString();

async function compileProgram(client, TealSource) {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(TealSource);
    let compileResponse = await client.compile(programBytes).do();
    let compiledProgram = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
    return compiledProgram;
}

(async () => {
    try {
        const localInts = 0
        const localBytes = 0
        const globalInts = 3
        const globalBytes = 0

        let approvalProgramFile = await open("./src/contracts/voting_approval.teal");
        let clearProgramFile = await open("./src/contracts/voting_clear.teal");

        const approvalProgram = await approvalProgramFile.readFile();
        const clearProgram = await clearProgramFile.readFile();

        const approvalProgramBinary = await compileProgram(algodClient, approvalProgram);
        const clearProgramBinary = await compileProgram(algodClient, clearProgram);

        let params = await algodClient.getTransactionParams().do();
        const onComplete = algosdk.OnApplicationComplete.NoOpOC;
        

        console.log("Deploying Application...");

        let txn = algosdk.makeApplicationCreateTxnFromObject({
            sender: sender,
            suggestedParams: params,
            onComplete: onComplete,
            approvalProgram: approvalProgramBinary,
            clearProgram: clearProgramBinary,
            numLocalInts: localInts,
            numLocalByteSlices: localBytes,
            numGlobalInts: globalInts,
            numGlobalBytesSlices: globalBytes
        });

        let txId = txn.txID().toString();

        let signedTxn = txn.signTxn(myaccount.sk);
        console.log("Signed transaction with txID: %s", txId);

        await algodClient.sendRawTransaction(signedTxn).do();
        await algosdk.waitForConfirmation(algodClient, txId, 2);

        let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
        let appId = transactionResponse.applicationIndex || transactionResponse['application-index'];
        console.log("App ID:", appId?.toString());
        console.log("Created new application with appId: %d", appId);
    } catch (err) {
        console.error("Error deploying application: ", err);
        process.exit(1);
    }
})();