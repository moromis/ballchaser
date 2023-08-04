const { BallChasingAPI } = require("ballchasing");
const express = require("express");

const PORT = process.env.PORT || 3001;

const app = express();

let bc = undefined;

app.get("/api", async (req, res) => {
    if (req.headers.authorization) {
        if (bc === undefined) {
            bc = new BallChasingAPI(req.headers.authorization);
        }
        const pingResponse = await bc.ping();
        if (pingResponse.response.status === 200) {
            res.json({ ok: true });
        } else {
            res.json({ ok: false });
        }
    }
});

app.get("/user", async (req, res) => {
    if (bc !== undefined) {
        // get replays by player "noot" from Jan 1 2020 to Jan 1 2021 on map "park_p"
        // sorted ascending by the date of the replay
        const replaysResponse = await bc.listReplays({
            // playerName: "musty",
            createdAfter: "2023-01-01T00:00:00-05:00",
            createdBefore: "2024-01-01T00:00:00-05:00",
            map: "underwater_p",
            sortBy: "replay-date",
            sortDir: "asc",
            playerId: "steam:76561198372811861",
            // createdAfter: "2023-01-01T00:00:00-05:00",
            // // createdBefore: "2021-01-01T00:00:00-05:00",
            // // map: "park_p",
            // sortBy: "replay-date",
            // sortDir: "asc"
        });
        res.json({ data: replaysResponse, ok: true });
    } else {
        res.json({ data: "No API key entered!", ok: false });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);

    // const bc = new BallChasingAPI("43MRuxez3TDY8vcyxKUuiPS4Ctg6dv7BYAFTERkz");

    // (async () => {

    //     // ping the ballchasing.com api server
    //     // This tests connectivity to the server
    //     // and your API key
    //     const pingResponse = await bc.ping();
    //     console.log(pingResponse)

    //     // get a list of maps
    //     const mapsResponse = await bc.getMaps();
    //     console.log(mapsResponse)

    //     // get replays by player "noot" from Jan 1 2020 to Jan 1 2021 on map "park_p"
    //     // sorted ascending by the date of the replay
    //     const replaysResponse = await bc.listReplays({
    //         playerName: "noot",
    //         createdAfter: "2020-01-01T00:00:00-05:00",
    //         createdBefore: "2021-01-01T00:00:00-05:00",
    //         map: "park_p",
    //         sortBy: "replay-date",
    //         sortDir: "asc"
    //     });
    //     console.log(replaysResponse)

    // })();
});