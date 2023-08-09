
const express = require("express");
const { getEnvValue, setEnvValue } = require("./apiKeyManager");
const path = require('path');
const { search, setup, setupBallChasingApiClient } = require("./search");

const PORT = process.env.PORT || 3001;

const app = express();

let players = null;

app.get("/api", async (req, res) => {
    if (req.headers.authorization) {
        setEnvValue("apiKey", req.headers.authorization)
    }
    const result = await setupBallChasingApiClient(req);
    res.json({ ok: result });
});

app.get("/apiKey", async (req, res) => {
    const apiKey = getEnvValue("apiKey")
    res.json(apiKey);
});

app.get("/players", async (req, res) => {
    res.json(players);
});

app.get("/search", async (req, res) => {
    await search(req, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.get('/test', function (req, res) {
    res.sendFile('../client/build/index.html', { root: __dirname })
});


app.listen(PORT, () => {
    players = setup()
    console.log(`Server listening on ${PORT}`);
});


