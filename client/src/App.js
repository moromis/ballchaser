// TODO: write tests

import {
  Button,
  Classes,
  Collapse,
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
import { endOfDay, format, startOfDay } from "date-fns";
import { differenceBy, unionBy, without } from "lodash";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Results from "./Results";
import { MINIMUM_SEARCH_INTERVAL, RFC339_DATE_FORMAT } from "./const";

function App() {
  const waitingFetches = useRef([]);
  const [errorText, setErrorText] = useState(null);
  const [waitTime, setWaitTime] = useState(MINIMUM_SEARCH_INTERVAL);
  const [workingApiKey, setWorkingApiKey] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [players, setPlayers] = useState(null);
  const [pro, setPro] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [selectedRanks, setSelectedRanks] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [dateRange, setDateRange] = useState([
    startOfDay(new Date()),
    endOfDay(new Date()),
  ]);
  const [playerSelectIsOpen, setPlayerSelectIsOpen] = useState(true);

  const searchFetchAbortController = new AbortController();
  const { abortSearchSignal } = searchFetchAbortController;

  const selectAllPlayersAndRanks = useCallback(() => {
    setSelectedPlayers(
      players
        ? Object.values(players)
            .map((rank) =>
              Object.entries(rank).map(([name, id]) => ({
                name,
                id,
              }))
            )
            .flat()
        : []
    );
    setSelectedRanks(players ? Object.keys(players) : null);
  }, [players]);

  useEffect(() => {
    selectAllPlayersAndRanks();
  }, [players, selectAllPlayersAndRanks]);

  useEffect(() => {
    if (players === null) {
      fetch("/players")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            const { players } = data;
            setPlayers(players || {});
          }
        });
    }
  }, [players]);

  useEffect(() => {
    fetch("/apiKey")
      .then((res) => res.json())
      .then((data) => {
        setApiKey(data || "");
      });
  }, [setApiKey]);

  const pushApiKeyToServer = useCallback(() => {
    if (apiKey.length > 0) {
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
    setApiKey(workingApiKey);
    e.preventDefault();
  };

  const changeWaitTime = (e) => {
    setWaitTime(e.target.value);
  };

  const stopSearch = () => {
    setSearching(false);
    searchFetchAbortController.abort();
    waitingFetches.current.forEach((f) => clearTimeout(f));
    waitingFetches.current = [];
  };

  const search = useCallback(async () => {
    setSearching(true);
    setResults(null);
    // reset hashed replay IDs (for deduplication)
    await fetch("/resetIds");
    selectedPlayers.forEach(({ id: playerId, name: playerName }, i) => {
      const params = {
        headers: {
          Authorization: apiKey,
        },
        pro,
        playerId,
        createdAfter: format(dateRange[0], RFC339_DATE_FORMAT),
        createdBefore: format(
          dateRange[1] === null ? endOfDay(dateRange[0]) : dateRange[1],
          RFC339_DATE_FORMAT
        ),
      };
      const queryString = new URLSearchParams(params).toString();
      const newFetch = setTimeout(() => {
        fetch(`/search?${queryString}`, {
          signal: abortSearchSignal,
          headers: {
            Authorization: apiKey,
          },
        })
          .then((res) => res.json())
          .then(({ data, ok }) => {
            if (ok && data.length > 0) {
              setResults((oldList) => ({ ...oldList, [playerName]: data }));
            }
          })
          .finally(() => {
            if (i === selectedPlayers.length - 1) {
              setSearching(false);
            }
          });
      }, Math.max(waitTime, MINIMUM_SEARCH_INTERVAL) * i);
      waitingFetches.current.push(newFetch);
    });
  }, [
    abortSearchSignal,
    apiKey,
    dateRange,
    pro,
    selectedPlayers,
    waitTime,
    waitingFetches,
  ]);

  const getPlayerTagIntent = (id) => {
    if (selectedPlayers.length) {
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
    return Intent.DANGER;
  };

  const handleDateRangeChange = (dateRange) => {
    const formattedDates = dateRange.map((d, i) => {
      if (d !== null && i === 1) {
        return endOfDay(d);
      } else if (d !== null) {
        return startOfDay(d);
      }
      return d;
    });
    setDateRange(formattedDates);
  };

  const handlePlayerTagClick = (player) => {
    if (selectedPlayers.length) {
      if (selectedPlayers.find((p) => p.id === player.id)) {
        const newSelectedPlayers = differenceBy(
          selectedPlayers,
          [player],
          "id"
        );
        setSelectedPlayers(newSelectedPlayers);
        if (!newSelectedPlayers.length) {
          setSelectedRanks([]);
          setErrorText("No players selected");
        }
      } else {
        setSelectedPlayers((players) => unionBy(players, [player], "id"));
        setErrorText(null);
      }
    } else {
      setSelectedRanks([
        Object.keys(players).find((rank) => player.name in players[rank]),
      ]);
      setSelectedPlayers([player]);
      setErrorText(null);
    }
  };

  const handleRankClick = (rank) => {
    const rankPlayers = Object.entries(players[rank]).map(([name, id]) => ({
      name,
      id,
    }));
    if (selectedRanks && selectedRanks.length) {
      if (selectedRanks.indexOf(rank) === -1) {
        setSelectedRanks((ranks) => [...ranks, rank]);
        setSelectedPlayers((selectedPlayers) =>
          unionBy(selectedPlayers, rankPlayers, "id")
        );
        setErrorText(null);
      } else {
        const newSelectedRanks = without(selectedRanks, rank);
        setSelectedRanks(newSelectedRanks);
        setSelectedPlayers((selectedPlayers) =>
          differenceBy(selectedPlayers, rankPlayers, "id")
        );
        if (!newSelectedRanks.length) {
          setErrorText("No players selected");
        }
      }
    } else {
      setSelectedRanks([rank]);
      setSelectedPlayers(rankPlayers);
      setErrorText(null);
    }
  };

  const toggleAllPlayers = () => {
    if (selectedPlayers.length) {
      setSelectedPlayers([]);
      setSelectedRanks([]);
    } else {
      selectAllPlayersAndRanks();
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
              label={`Wait time between API calls (${MINIMUM_SEARCH_INTERVAL}ms minimum)`}
              helperText={
                waitTime < MINIMUM_SEARCH_INTERVAL
                  ? `${MINIMUM_SEARCH_INTERVAL}ms minimum`
                  : null
              }
              labelFor="wait-time"
              intent={Intent.DANGER}
            >
              <InputGroup
                value={waitTime}
                onChange={changeWaitTime}
                id="wait-time"
              />
            </FormGroup>
            <FormGroup label="Date range" labelFor="date-range">
              <DateRangePicker
                id="date-range"
                className={Classes.ELEVATION_1}
                allowSingleDayRange={true}
                onChange={handleDateRangeChange}
                value={dateRange}
              />
            </FormGroup>
            <FormGroup label="Players to find games from" labelFor="players">
              <Button
                onClick={() => {
                  setPlayerSelectIsOpen((prev) => !prev);
                }}
                text={playerSelectIsOpen ? "Hide Players" : "Show Players"}
                icon="chevron-down"
                fill
              />
              <Collapse isOpen={playerSelectIsOpen}>
                <Button
                  text={
                    selectedPlayers.length > 0 ? "Deselect all" : "Select all"
                  }
                  onClick={toggleAllPlayers}
                  intent={
                    selectedPlayers.length > 0 ? Intent.DANGER : Intent.SUCCESS
                  }
                />
                {players !== null ? (
                  Object.keys(players).map((rank) => (
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
                  ))
                ) : (
                  <Spinner />
                )}
              </Collapse>
            </FormGroup>
            <FormGroup
              label="Only show games with pros in them?"
              labelFor="pro"
            >
              <Switch onChange={handleProChange} checked={pro} id="pro" />
            </FormGroup>
            <div>
              {!searching ? (
                <FormGroup
                  helperText={errorText}
                  labelFor="search-button"
                  intent={Intent.DANGER}
                >
                  <Button
                    disabled={errorText !== null}
                    id="search-button"
                    intent={errorText === null ? Intent.SUCCESS : Intent.NONE}
                    onClick={search}
                  >
                    Search
                  </Button>
                </FormGroup>
              ) : (
                <Button intent={Intent.DANGER} onClick={stopSearch}>
                  Stop Searching
                </Button>
              )}
            </div>
            {searching ? <Spinner /> : null}
            {results ? (
              <Results results={results} />
            ) : !searching ? (
              <NonIdealState icon={<Search />} title="No search results" />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;
