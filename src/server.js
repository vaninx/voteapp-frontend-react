import express from "express";
import cors from "cors";
import algosdk from "algosdk";
import { storeVoteData } from "./components/helper.js";
import { getClient, getAccount } from "./components/config.js";

// We define a constant APP_ID which represents the ID of the deployed Algorand application (smart contract) that we will interact with to record votes. This ID is used in the application call transactions to specify which application we are calling.
const APP_ID = 1006;
const app = express();
app.use(cors());
app.use(express.json());

// We define an array of programming languages that users can vote for. Each language has an ID, name, logo, and additional details such as use cases, rank, and homepage URL. This data will be served through the API endpoints to provide information about the available voting options.
const languages = [
    { id: "go", name: "Go" , logo: "go.png", codedetail: { usecase: "Cloud, Web, CLI", rank: 5, homepage: "https://golang.org/" } },
    { id: "java", name: "Java" , logo: "java.png", codedetail: { usecase: "Enterprise, Android", rank: 4, homepage: "https://www.java.com/" } },
    { id: "nodejs", name: "Node.js" , logo: "nodejs.png", codedetail: { usecase: "Web, API, Microservices", rank: 3, homepage: "https://nodejs.org/" } },
]

// We define an API endpoint to retrieve the list of programming languages available for voting. This endpoint responds with a JSON array of language objects when a GET request is made to "/languages".
app.get("/languages", (req, res) => {
    res.json(languages);
});

// We define an API endpoint to retrieve the details of a specific programming language based on its ID. When a GET request is made to "/languages/:id", we search for the language with the matching ID in the languages array and respond with its details. If the language is not found, we return a 404 error.
app.get("/languages/:id", (req, res) => {
    const language = languages.find(lang => lang.id === req.params.id);
    if (!language) {
        res.status(404).json({ error: "Language not found" });
    } else {
        res.json(language);
    }
});

// We define an API endpoint to retrieve the current vote count for a specific programming language. When a GET request is made to "/votes/:id", we interact with the Algorand blockchain to fetch the global state of the application and find the vote count for the specified language. The vote count is then returned in the response.
app.get("/votes/:id", async (req, res) => {
    try{
        const client = getClient();
        const appInfo = await client.getApplicationByID(APP_ID).do();
        const globalState = appInfo.params.globalState;

        const candidate = globalState.find(item => {
            const key = Buffer.from(Object.values(item.key)).toString();
            return key === req.params.id;
        });

       const count = candidate ? Number(candidate.value.uint) : 0;
        res.json({ id: req.params.id, votes: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get votes" });
    }
});

// We define an API endpoint to cast a vote for a specific programming language. When a POST request is made to "/vote/:id", we first check if the language ID is valid. If it is, we store the vote data on the Algorand blockchain using the storeVoteData function, and then we create and send an application call transaction to update the vote count in the smart contract's global state. If any errors occur during this process, we return a 500 error response.
app.post("/vote/:id", async (req, res) => {
    const language = languages.find(lang => lang.id === req.params.id);
    if (!language) {
        res.status(404).json({ error: "Language not found" });
        return;
    }

    try {
        // Store the vote data on the Algorand blockchain by calling the storeVoteData function. This function encodes the vote data and sends a transaction to the network, allowing us to keep a record of each vote cast.
        await storeVoteData({ language: language.id });
        console.log("Transaction note stored");

        // Update smart contract global state
        const client = getClient();
        const account = getAccount();
        const sender = account.addr.toString();
        const params = await client.getTransactionParams().do();
        const appArgs = [new Uint8Array(Buffer.from("vote_" + language.id))];

        console.log("Calling smart contract with arg:", "vote_" + language.id); 

        // We create an application call transaction to cast a vote for the specified programming language. The transaction includes the application ID, the arguments indicating which language is being voted for, and is signed with the account's secret key before being sent to the network. We log the transaction ID for reference and wait for confirmation to ensure that the transaction has been processed successfully.
        const txn = algosdk.makeApplicationNoOpTxnFromObject({
            sender: sender,
            suggestedParams: params,
            appIndex: APP_ID,
            appArgs: appArgs
        });

        // Sign the transaction and send it to the network
        const signedTxn = txn.signTxn(account.sk);
        console.log("Sending transaction...");
        const result = await client.sendRawTransaction(signedTxn).do();
        console.log("Done:", result);

        res.json({ message: "Vote recorded successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to record vote" });
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});