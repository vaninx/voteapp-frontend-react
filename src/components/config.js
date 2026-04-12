import algosdk from "algosdk";

const algodToken = "a".repeat(64);
const server = "http://localhost";
const port = "4001";

const mnemonic = "surround boring rubber dream nominee system thank tornado earth shed tool surface involve lumber scout network marble assume legal crime limit payment sentence about choice";

export function getClient() {
    let client = new algosdk.Algodv2(algodToken, server + ":" + port, {});
    return client;
}

export function getAccount() {
    let account = algosdk.mnemonicToSecretKey(mnemonic);
    return account;
}

