import dotenv from 'dotenv';
import algosdk from 'algosdk';
import { getAccount } from './components/config.js';
dotenv.config();

async function readGlobalState(client, appId) {
    let applicationInfoResponse = await client.getApplicationByID(appId).do();
    let globalState = applicationInfoResponse.params.globalState;
    for (let n = 0; n < globalState.length; n++) {
        let key = Buffer.from(Object.values(globalState[n].key)).toString();
        let value = globalState[n].value.uint;
        console.log(`${key}: ${value}`);
    }
}

let index = 1006;
let myaccount = getAccount();
let sender = myaccount.addr.toString();

const algodToken = "a".repeat(64);
const algodClient = new algosdk.Algodv2(algodToken, "http://localhost", "4001");

let appArgs1 = [];
let appArgs2 = [];
let appArgs3 = [];
let go = "vote_go";
let java = "vote_java";
let nodejs = "vote_nodejs";

appArgs1.push(new Uint8Array(Buffer.from(go)));
appArgs2.push(new Uint8Array(Buffer.from(java)));
appArgs3.push(new Uint8Array(Buffer.from(nodejs)));

(async () => {
    try {
        console.log("Reading global state...");
        await readGlobalState(algodClient, index);

        // Voting for each programming language by calling the application with the respective arguments. After each vote, we wait for confirmation and then read the global state again to see the updated vote counts.
        let params = await algodClient.getTransactionParams().do();
        console.log("Voting for Go...");

        // We create an application call transaction with the appropriate arguments to cast a vote for the "Go" programming language. The transaction is signed and sent to the network, and we wait for confirmation before proceeding.
        let txn = algosdk.makeApplicationNoOpTxnFromObject({
            sender: sender,
            suggestedParams: params,
            appIndex: index,
            appArgs: appArgs1
        });
        let txId = txn.txID().toString(); 

        let signedTxn = txn.signTxn(myaccount.sk);
       
        // Log the transaction ID for reference and send the signed transaction to the network. We then wait for confirmation to ensure that the transaction has been processed before reading the global state again.
        console.log("Signed transaction with txID: %s", txId);
        await algodClient.sendRawTransaction(signedTxn).do();
        await algosdk.waitForConfirmation(algodClient, txId, 2); 

        // After the transaction is confirmed, we read the pending transaction information to check the results of the application call. We log the application ID that was called and any updates to the global state, which should reflect the new vote count for the "Go" programming language.
        let transactionResponse = await algodClient
        .pendingTransactionInformation(txId)
        .do();
        console.log("Called app-id:",
        transactionResponse["txn"]["txn"]["apid"]);
        if (transactionResponse["global-state-delta"] !== undefined) {
            console.log("Global State updated:",transactionResponse["global-state-delta"]);
        }

        console.log("Voting for Java...");
        let txn2 = algosdk.makeApplicationNoOpTxnFromObject({
            sender: sender,
            suggestedParams: params,
            appIndex: index,
            appArgs: appArgs2
        });
        let txId2 = txn2.txID().toString(); 

        let signedTxn2 = txn2.signTxn(myaccount.sk);
       
        console.log("Signed transaction with txID: %s", txId2);
        await algodClient.sendRawTransaction(signedTxn2).do();
        await algosdk.waitForConfirmation(algodClient, txId2, 2); 

        let transactionResponse2 = await algodClient
        .pendingTransactionInformation(txId2)
        .do();
        console.log("Called app-id:",
        transactionResponse2["txn"]["txn"]["apid"]);
        if (transactionResponse2["global-state-delta"] !== undefined) {
            console.log("Global State updated:",transactionResponse2["global-state-delta"]);
        }

        console.log("Voting for NodeJS...");
        let txn3 = algosdk.makeApplicationNoOpTxnFromObject({
            sender: sender,
            suggestedParams: params,
            appIndex: index,
            appArgs: appArgs3
        });
        let txId3 = txn3.txID().toString(); 

        let signedTxn3 = txn3.signTxn(myaccount.sk);
       
        console.log("Signed transaction with txID: %s", txId3);
        await algodClient.sendRawTransaction(signedTxn3).do();
        await algosdk.waitForConfirmation(algodClient, txId3, 2); 

        let transactionResponse3 = await algodClient
        .pendingTransactionInformation(txId3)
        .do();
        console.log("Called app-id:",
        transactionResponse3["txn"]["txn"]["apid"]);
        if (transactionResponse3["global-state-delta"] !== undefined) {
            console.log("Global State updated:",transactionResponse3["global-state-delta"]);
        }

    } catch (err) {
        // If any errors occur during the voting process, we catch them and log an error message to the console. We also exit the process with a non-zero status code to indicate that the tests failed.
        console.error("Tests failed! ", err);
        process.exit(1); 
    }
})();