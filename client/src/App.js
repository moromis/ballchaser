import { Button, FormGroup, InputGroup, Intent, NonIdealState, Spinner, Switch } from "@blueprintjs/core";
import { Search } from "@blueprintjs/icons";
import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import Results from './Results';

function App() {

  const [workingApiKey, setWorkingApiKey] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [pro, setPro] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);

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
