import algosdk from "algosdk";

// Configuration for Algorand client and account details. In a real application, you would want to securely manage your mnemonic and not hardcode it in your source code.
const algodToken = "a".repeat(64);
const server = "http://localhost";
const port = "4001";

const mnemonic = "surround boring rubber dream nominee system thank tornado earth shed tool surface involve lumber scout network marble assume legal crime limit payment sentence about choice";

// Function to create and return an Algorand client instance using the provided configuration.
export function getClient() {
    let client = new algosdk.Algodv2(algodToken, server + ":" + port, {});
    return client;
}

// Function to convert the mnemonic to an account object, which includes the public address and secret key. This account will be used to interact with the Algorand blockchain, such as signing transactions.
export function getAccount() {
    let account = algosdk.mnemonicToSecretKey(mnemonic);
    return account;
}

