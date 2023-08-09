const { BallChasingAPI } = require("@moromis/ballchasing");
const { getEnvValue } = require("./apiKeyManager");
const { loadPlayers } = require("./loadPlayers");

let bc = null;

const setupBallChasingApiClient = async (req) => {
    if (req.headers.authorization && !bc) {
        bc = new BallChasingAPI(req.headers.authorization);
        console.log("bc exists now? ", bc)
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
};

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
    const players = loadPlayers();
    return players
}

async function search(req, res) {
    if (!bc) {
        await setupBallChasingApiClient(req);
    }
    if (bc) {
        // get replays by player "noot" from Jan 1 2020 to Jan 1 2021 on map "park_p"
        // sorted ascending by the date of the replay
        const params = req.query;
        // https://ballchasing.com/doc/api#replays-replays-get
        const replaysResponse = await bc.listReplays({
            ...params,
            createdAfter: "2023-07-28T00:00:00-05:00",
            createdBefore: "2024-08-05T00:00:00-05:00",
            sortBy: "replay-date",
            sortDir: "asc",
        });
        res.json({ ...replaysResponse, ok: true });
    } else {
        res.json({ data: "Did you pass an authorization token in the request?", ok: false });
    }
}

module.exports = {
    search, setup, setupBallChasingApiClient
}
