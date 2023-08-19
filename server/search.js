const { BallChasingAPI } = require("@moromis/ballchasing");
const { getEnvValue } = require("./apiKeyManager");
const { loadPlayers } = require("./loadPlayers");
const { isEmpty, at } = require("lodash");

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

const createReplayId = (replay) => {
  const orangePlayers = replay.orange.players;
  const bluePlayers = replay.blue.players;
  const playerIds = orangePlayers.concat(bluePlayers).map((p) => at(p, 'id.id'));
  const timestamp = new Date(replay.date).toUTCString().slice(0, -7);;
  const uniqueReplayId = (playerIds).join(".") + timestamp;
  console.log(uniqueReplayId)
  return uniqueReplayId;
}

const isDuplicate = (uniqueReplayId) => {
  return seenReplayIds.has(uniqueReplayId)
}

const checkDuosOrLess = (replay) => {
  return replay.blue.players.length + replay.orange.players.length > 4
}

async function search(req, res) {
  if (!bc) {
    await setupBallChasingApiClient(req);
  }
  if (bc) {
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
        const uniqueReplayId = createReplayId(replay);
        if (
          isDuplicate(uniqueReplayId) || // duplicate replay
          replay.duration <= 30 || // exclude replays that are less than 30 seconds
          replay.map_code === "labs_utopia_p" || // exclude custom maps for now
          isEmpty(replay.blue) || // blue team has no players
          isEmpty(replay.orange) || // orange team has no players
          checkDuosOrLess(replay)
        ) {
          return false;
        }
        seenReplayIds.add(uniqueReplayId);
        return true;
      });
    }
    res.json({ data: filteredData, ok: true });
  } else {
    console.log("no good?");
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
