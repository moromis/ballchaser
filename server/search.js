const { BallChasingAPI } = require("@moromis/ballchasing");
const { getEnvValue } = require("./apiKeyManager");
const { loadPlayers } = require("./loadPlayers");

let bc = null;
const seenReplayIds = new Set(); // TODO: read and write to file to store between sessions

const resetIds = () => {
  seenReplayIds.clear();
};

const setupBallChasingApiClient = async (req) => {
  if (req.headers.authorization && !bc) {
    bc = new BallChasingAPI(req.headers.authorization);
    console.log("bc exists now? ", bc);
  }
  if (bc) {
    const pingResponse = await bc.ping();
    if (pingResponse.response.status === 200) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};

const setup = () => {
  // load API key, setup ballchasing API client
  const apiKey = getEnvValue("apiKey");
  if (apiKey !== null && bc === null) {
    setupBallChasingApiClient({
      headers: {
        Authorization: apiKey,
      },
    });
  }

  // load players list
  const players = loadPlayers();
  return players;
};

async function search(req, res) {
  if (!bc) {
    await setupBallChasingApiClient(req);
  }
  if (bc) {
    // get replays by player "noot" from Jan 1 2020 to Jan 1 2021 on map "park_p"
    // sorted ascending by the date of the replay
    const params = req.query;
    // https://ballchasing.com/doc/api#replays-replays-get
    const { data } = await bc.listReplays({
      ...params,
      sortBy: "replay-date", // TODO: receive this from frontend
      sortDir: "asc", // TODO: receive this from frontend
    });
    let filteredData = [];
    if (data.list && data.list.length) {
      filteredData = data.list.filter((replay) => {
        if (
          seenReplayIds.has(replay.id) ||
          replay.duration < 30 ||
          replay.map_code === "labs_utopia_p" ||
          replay.blue.players.length + replay.orange.players.length > 4
        ) {
          return false;
        }
        seenReplayIds.add(replay.id);
        return true;
      });
    }
    res.json({ data: filteredData, ok: true });
  } else {
    res.json({
      data: "Did you pass an authorization token in the request?",
      ok: false,
    });
  }
}

module.exports = {
  search,
  setup,
  setupBallChasingApiClient,
  resetIds,
};
