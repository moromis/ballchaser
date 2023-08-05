import { Button, FormGroup, InputGroup, Intent, NonIdealState, Spinner, Switch, Tag } from "@blueprintjs/core";
import { Search } from "@blueprintjs/icons";
import { difference, union, without } from "lodash";
import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import Results from './Results';

function App() {

  const [workingApiKey, setWorkingApiKey] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [players, setPlayers] = useState(null);
  const [pro, setPro] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState(null);
  const [selectedRanks, setSelectedRanks] = useState(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetch("/players")
      .then((res) => res.json())
      .then((data) => {
        console.log("asked server for players, got", data)
        if (data) {
          const { players } = data;
          setPlayers(players || null);
          setSelectedPlayers(players ? Object.values(players).map((rank) => Object.keys(rank)).flat() : null);
          setSelectedRanks(players ? Object.keys(players) : null)
        }
      });
  }, [])

  useEffect(() => {
    fetch("/apiKey")
      .then((res) => res.json())
      .then((data) => {
        console.log("asked server for api key, got", data)
        setApiKey(data || "");
      });
  }, [setApiKey])

  const pushApiKeyToServer = useCallback(() => {
    if (apiKey.length > 0) {
      console.log("fetching...")
      fetch("/api", {
        headers: {
          "Authorization": apiKey,
        },
      })
        .then((res) => res.json())
        .then((data) => { return data.ok });
    } else {
      return false
    }
  }, [apiKey])

  useEffect(() => {
    pushApiKeyToServer()
  }, [pushApiKeyToServer])

  const handleChange = (event) => {
    setWorkingApiKey(event.target.value);
  }

  const handlePlayerNameChange = (event) => {
    setPlayerName(event.target.value);
  }

  const handleProChange = () => {
    setPro((current) => !current);
  }


  const handleApiKeySubmit = (e) => {
    console.log("saving", workingApiKey)
    setApiKey(workingApiKey);
    e.preventDefault();
  }

  const handleSearch = (e) => {
    console.log("searching")
    setSearching(true)
    const params = {
      playerName,
      pro
    }
    const queryString = new URLSearchParams(params).toString()
    fetch(`/search?${queryString}`, {
      headers: {
        "Authorization": apiKey,
      },
      query: params
    })
      .then((res) => res.json())
      .then((data) => {
        setSearching(false)
        const replayList = data?.data
        setResults(replayList)
      });
    e.preventDefault();
  }

  const getPlayerTagIntent = (name) => {
    if (selectedPlayers && selectedPlayers.length) {
      return selectedPlayers.indexOf(name) !== -1 ? Intent.SUCCESS : Intent.NONE
    }
  }

  const getRankIntent = (rank) => {
    if (selectedRanks && selectedRanks.length) {
      return selectedRanks.indexOf(rank) !== -1 ? Intent.PRIMARY : Intent.DANGER
    }
  }

  const handlePlayerTagClick = (name) => {
    if (selectedPlayers && selectedPlayers.length) {
      if (selectedPlayers.indexOf(name) === -1) {
        setSelectedPlayers((players) => [...players, name])
      } else {
        setSelectedPlayers((players) => without(players, name))
      }
    }
  }

  const handleRankClick = (rank) => {
    if (selectedRanks && selectedRanks.length) {
      if (selectedRanks.indexOf(rank) === -1) {
        setSelectedRanks((ranks) => [...ranks, rank])
        setSelectedPlayers((selectedPlayers) => union(selectedPlayers, Object.keys(players[rank])))
      } else {
        setSelectedRanks((ranks) => without(ranks, rank))
        setSelectedPlayers((selectedPlayers) => difference(selectedPlayers, Object.keys(players[rank])))
      }
    }
  }

  return (
    <div className="bp5-dark">
      <div className="App">
        {!apiKey.length && (
          <form onSubmit={handleApiKeySubmit}>
            <div>
              <label>Enter Your Ballchasing API Key
                <input type="text" value={workingApiKey} onChange={handleChange} />
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
              label="Players to find games from"
              labelFor="players"
            >
              {Object.keys(players).map((rank) => (
                <div key={rank}>
                  <Button intent={getRankIntent(rank)} className="rank-button" onClick={() => handleRankClick(rank)}>Rank {rank}</Button>
                  {Object.keys(players[rank]).map((name) => <Button className="player-tag-button" key={name} onClick={() => handlePlayerTagClick(name)}>
                    <Tag intent={getPlayerTagIntent(name)}>{name}</Tag>
                  </Button>)}
                </div>
              ))}
            </FormGroup>
            <FormGroup
              label="Player Name"
              labelFor="player-name"
            >
              <InputGroup value={playerName} onChange={handlePlayerNameChange} id="player-name" />
            </FormGroup>
            <FormGroup
              label="Only show games with pros in them?"
              labelFor="pro"
            >
              <Switch onChange={handleProChange} checked={pro} id="pro" />
            </FormGroup>
            <div>
              <Button intent={Intent.SUCCESS} onClick={handleSearch}>Search</Button>
            </div>
            {searching ? (
              <Spinner />
            ) : (results ? <Results results={results} /> : (
              <NonIdealState
                icon={<Search />}
                title="No search results"
              />
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default App;
