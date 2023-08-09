import {
  Button,
  Classes,
  FormGroup,
  InputGroup,
  Intent,
  NonIdealState,
  Spinner,
  Switch,
  Tag,
} from "@blueprintjs/core";
import { DateRangePicker } from "@blueprintjs/datetime";
import { Search } from "@blueprintjs/icons";
import { addDays, format, subDays } from "date-fns";
import { differenceBy, unionBy, without } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Results from "./Results";
import { RFC339_DATE_FORMAT } from "./const";

function App() {
  const [waitTime, setWaitTime] = useState(600);
  const [workingApiKey, setWorkingApiKey] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [players, setPlayers] = useState(null);
  const [pro, setPro] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedRanks, setSelectedRanks] = useState(null);
  const searching = useRef(false);
  const [results, setResults] = useState(null);
  const [dateRange, setDateRange] = useState([
    format(new Date(), RFC339_DATE_FORMAT),
    format(subDays(new Date(), 1), RFC339_DATE_FORMAT),
  ]);

  const searchFetchAbortController = new AbortController();
  const { abortSearchSignal } = searchFetchAbortController;

  useEffect(() => {
    fetch("/players")
      .then((res) => res.json())
      .then((data) => {
        console.log("asked server for players, got", data);
        if (data) {
          const { players } = data;
          setPlayers(players || null);
          setSelectedPlayers(
            players
              ? Object.values(players)
                  .map((rank) =>
                    Object.entries(rank).map(([name, id]) => ({ name, id }))
                  )
                  .flat()
              : null
          );
          setSelectedRanks(players ? Object.keys(players) : null);
        }
      });
  }, []);

  useEffect(() => {
    fetch("/apiKey")
      .then((res) => res.json())
      .then((data) => {
        console.log("asked server for api key, got", data);
        setApiKey(data || "");
      });
  }, [setApiKey]);

  const pushApiKeyToServer = useCallback(() => {
    if (apiKey.length > 0) {
      console.log("fetching...");
      fetch("/api", {
        headers: {
          Authorization: apiKey,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          return data.ok;
        });
    } else {
      return false;
    }
  }, [apiKey]);

  useEffect(() => {
    pushApiKeyToServer();
  }, [pushApiKeyToServer]);

  const handleChange = (event) => {
    setWorkingApiKey(event.target.value);
  };

  const handleProChange = () => {
    setPro((current) => !current);
  };

  const handleApiKeySubmit = (e) => {
    console.log("saving", workingApiKey);
    setApiKey(workingApiKey);
    e.preventDefault();
  };

  const changeWaitTime = (e) => {
    setWaitTime(e.target.value);
  };

  const stopSearch = () => {
    searching.current = false;
    searchFetchAbortController.abort();
  };

  const search = useCallback(async () => {
    searching.current = true;
    setResults([]);
    // reset hashed replay IDs (for deduplication)
    await fetch("/resetIds");
    selectedPlayers
      .map((p) => p.id)
      .forEach((playerId, i) => {
        const params = {
          headers: {
            Authorization: apiKey,
          },
          pro,
          playerId,
          createdAfter: dateRange[0],
          createdBefore: dateRange[1] === null ? dateRange[0] : dateRange[1],
        };
        const queryString = new URLSearchParams(params).toString();
        setTimeout(() => {
          if (searching.current) {
            fetch(`/search?${queryString}`, {
              signal: abortSearchSignal,
              headers: {
                Authorization: apiKey,
              },
            })
              .then((res) => res.json())
              .then(({ data, ok }) => {
                setResults((oldList) => unionBy(oldList, data, "id"));
              });
          }
        }, 600 * i);
      });
  }, [abortSearchSignal, apiKey, dateRange, pro, selectedPlayers]);

  const getPlayerTagIntent = (id) => {
    if (selectedPlayers && selectedPlayers.length) {
      return selectedPlayers.find((p) => p.id === id)
        ? Intent.SUCCESS
        : Intent.NONE;
    }
  };

  const getRankIntent = (rank) => {
    if (selectedRanks && selectedRanks.length) {
      return selectedRanks.indexOf(rank) !== -1
        ? Intent.PRIMARY
        : Intent.DANGER;
    }
  };

  const handleDateRangeChange = (dateRange) => {
    const formattedDates = dateRange.map((d, i) => {
      if (d !== null && i === 1) {
        return format(new Date(addDays(new Date(d), 1)), RFC339_DATE_FORMAT);
      } else if (d !== null) {
        return format(new Date(d), RFC339_DATE_FORMAT);
      }
      return d;
    });
    setDateRange(formattedDates);
  };

  const handlePlayerTagClick = (player) => {
    if (selectedPlayers && selectedPlayers.length) {
      if (selectedPlayers.find((p) => p.id === player.id)) {
        setSelectedPlayers((players) => differenceBy(players, [player], "id"));
      } else {
        setSelectedPlayers((players) => unionBy(players, [player], "id"));
      }
    }
  };

  const handleRankClick = (rank) => {
    if (selectedRanks && selectedRanks.length) {
      const rankPlayers = Object.entries(players[rank]).map(([name, id]) => ({
        name,
        id,
      }));
      if (selectedRanks.indexOf(rank) === -1) {
        setSelectedRanks((ranks) => [...ranks, rank]);
        setSelectedPlayers((selectedPlayers) =>
          unionBy(selectedPlayers, rankPlayers, "id")
        );
      } else {
        setSelectedRanks((ranks) => without(ranks, rank));
        setSelectedPlayers((selectedPlayers) =>
          differenceBy(selectedPlayers, rankPlayers, "id")
        );
      }
    }
  };

  return (
    <div className="bp5-dark">
      <div className="App">
        {!apiKey.length && (
          <form onSubmit={handleApiKeySubmit}>
            <div>
              <label>
                Enter Your Ballchasing API Key
                <input
                  type="text"
                  value={workingApiKey}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div>
              <input type="submit" value="Submit" />
            </div>
          </form>
        )}
        {apiKey.length ? (
          <>
            <FormGroup
              label="Wait time between API calls (600ms minimum)"
              helperText={waitTime < 600 ? "600ms minimum" : null}
              labelFor="wait-time"
              intent={Intent.DANGER}
            >
              <InputGroup
                value={waitTime}
                onChange={changeWaitTime}
                id="wait-time"
                min={600}
              />
            </FormGroup>
            <FormGroup label="Date range" labelFor="date-range">
              <DateRangePicker
                id="date-range"
                className={Classes.ELEVATION_1}
                allowSingleDayRange={true}
                onChange={handleDateRangeChange}
              />
            </FormGroup>
            <FormGroup label="Players to find games from" labelFor="players">
              {Object.keys(players).map((rank) => (
                <div key={rank}>
                  <Button
                    intent={getRankIntent(rank)}
                    className="rank-button"
                    onClick={() => handleRankClick(rank)}
                  >
                    Rank {rank}
                  </Button>
                  {Object.entries(players[rank]).map(([name, id]) => (
                    <Button
                      className="player-tag-button"
                      key={id}
                      onClick={() => handlePlayerTagClick({ name, id })}
                    >
                      <Tag intent={getPlayerTagIntent(id)}>{name}</Tag>
                    </Button>
                  ))}
                </div>
              ))}
            </FormGroup>
            <FormGroup
              label="Only show games with pros in them?"
              labelFor="pro"
            >
              <Switch onChange={handleProChange} checked={pro} id="pro" />
            </FormGroup>
            <div>
              {!searching.current ? (
                <Button intent={Intent.SUCCESS} onClick={search}>
                  Search
                </Button>
              ) : (
                <Button intent={Intent.DANGER} onClick={stopSearch}>
                  Stop Searching
                </Button>
              )}
            </div>
            {searching.current && <Spinner />}
            {results ? (
              <Results results={results} />
            ) : !searching.current ? (
              <NonIdealState icon={<Search />} title="No search results" />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;
