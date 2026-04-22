import algosdk from "algosdk";
import { getClient, getAccount } from "./config.js";

// This function takes the vote data as input and stores it on the Algorand blockchain. It creates a payment transaction with the vote data encoded in the note field, signs it with the account's secret key, and sends it to the network. The transaction ID is logged to the console for reference.
export const storeVoteData = async (data) => {
    try{
         const client = getClient();
         const account = getAccount();
         const params = await client.getTransactionParams().do();
         const note =  algosdk.msgpackRawEncode(data)
         const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: account.addr,
            receiver: account.addr,
            amount: 1000,
            note: note,
            suggestedParams: params
      });
      const signedTxn = txn.signTxn(account.sk);
      const response = await client.sendRawTransaction(signedTxn).do();
      console.log("Vote data stored with transaction ID: " + params.txId);
    } catch (error) {
        console.error("Failed to store vote data:" + error);
}
};