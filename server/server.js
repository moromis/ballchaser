const { BallChasingAPI } = require("ballchasing");
const express = require("express");
const { getEnvValue, setEnvValue } = require("./apiKeyManager");
const { loadPlayers } = require("./loadPlayers");

const PORT = process.env.PORT || 3001;

const app = express();

let bc = null;
let players = null;

const setupBallChasingApiClient = async (req) => {
    if (req.headers.authorization && bc === null) {
        bc = new BallChasingAPI(req.headers.authorization);
    }
    if (bc) {
        const pingResponse = await bc.ping();
        if (pingResponse.response.status === 200) {
            return true;
        } else {
            return false;
        }
    }
    return false
}

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
    if (bc === null) {
        setupBallChasingApiClient(req);
    }
    if (bc !== null) {
        // get replays by player "noot" from Jan 1 2020 to Jan 1 2021 on map "park_p"
        // sorted ascending by the date of the replay
        const params = req.query;
        console.log("params: ", params.pro, params.playerName)
        // https://ballchasing.com/doc/api#replays-replays-get
        const replaysResponse = await bc.listReplays({
            ...params,
            // playerName: "musty",
            createdAfter: "2023-01-01T00:00:00-05:00",
            createdBefore: "2024-01-01T00:00:00-05:00",
            // map: "underwater_p",
            sortBy: "replay-date",
            sortDir: "asc",
            // playerId: "steam:76561198372811861",
        });
        res.json({ ...replaysResponse, ok: true });
    } else {
        res.json({ data: "Did you pass an authorization token in the request?", ok: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

const setup = () => {
    // load API key, setup ballchasing API client
    const apiKey = getEnvValue("apiKey")
    if (apiKey !== null && bc === null) {
        setupBallChasingApiClient({
            headers: {
                "Authorization": apiKey,
            }
        })
    }

    // load players list
    players = loadPlayers();
}

app.listen(PORT, () => {
    setup()
    console.log(`Server listening on ${PORT}`);
});