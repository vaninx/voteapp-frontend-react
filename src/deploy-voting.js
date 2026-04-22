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
        // We define the number of local and global state variables that our application will use. In this case, we have 0 local integers, 0 local byte slices, 3 global integers (to store the vote counts for each programming language), and 0 global byte slices.
        const localInts = 0
        const localBytes = 0
        const globalInts = 3
        const globalBytes = 0

        // We read the approval and clear state TEAL programs from the src/contracts directory. These files contain the logic for how the application will handle votes and state clearing, respectively.
        let approvalProgramFile = await open("./src/contracts/voting_approval.teal");
        let clearProgramFile = await open("./src/contracts/voting_clear.teal");

        const approvalProgram = await approvalProgramFile.readFile();
        const clearProgram = await clearProgramFile.readFile();

        // We compile the approval and clear state programs using the Algorand client. The compiled programs are returned as byte arrays, which can then be used to create and deploy the application on the Algorand blockchain.
        const approvalProgramBinary = await compileProgram(algodClient, approvalProgram);
        const clearProgramBinary = await compileProgram(algodClient, clearProgram);

        let params = await algodClient.getTransactionParams().do();
        const onComplete = algosdk.OnApplicationComplete.NoOpOC;
        

        console.log("Deploying Application...");

        // We create an application creation transaction using the compiled approval and clear state programs, along with the specified local and global state schema. The transaction is signed with the account's secret key and sent to the network. We then wait for confirmation to ensure that the application has been successfully deployed before proceeding.
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
        
        // After the transaction is confirmed, we read the pending transaction information to check the results of the application creation. We log the application ID that was created, which will be used for interacting with the application in future transactions.
        let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
        let appId = transactionResponse.applicationIndex || transactionResponse['application-index'];
        console.log("App ID:", appId?.toString());
        console.log("Created new application with appId: %d", appId);
    } catch (err) {
        console.error("Error deploying application: ", err);
        process.exit(1);
    }
})();