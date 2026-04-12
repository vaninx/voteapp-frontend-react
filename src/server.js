import express from "express";
import cors from "cors";
import { storeVoteData } from "./components/helper.js";

const app = express();
app.use(cors());
app.use(express.json());

const languages = [
    { id: "go", name: "Go" , logo: "go.png", codedetail: { usecase: "Cloud, Web, CLI", rank: 5, homepage: "https://golang.org/" } },
    { id: "java", name: "Java" , logo: "java.png", codedetail: { usecase: "Enterprise, Android", rank: 4, homepage: "https://www.java.com/" } },
    { id: "nodejs", name: "Node.js" , logo: "nodejs.png", codedetail: { usecase: "Web, API, Microservices", rank: 3, homepage: "https://nodejs.org/" } },
]

app.get("/languages", (req, res) => {
    res.json(languages);
});

app.get("/languages/:id", (req, res) => {
    const language = languages.find(lang => lang.id === req.params.id);
    if (!language) {
        res.status(404).json({ error: "Language not found" });
    } else {
        res.json(language);
    }
});

app.post("/vote/:id", async (req, res) => {
    const language = languages.find(lang => lang.id === req.params.id);
    if (!language) {
        res.status(404).json({ error: "Language not found" });
        return;
    }

    try {
        await storeVoteData({ language: language.id });
        res.json({ message: "Vote recorded successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to record vote" });
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});