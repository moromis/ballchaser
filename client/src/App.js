import React, { useCallback, useEffect, useState } from 'react';
import ContentLoader from 'react-content-loader';
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
    <div className="App">
      <header className="App-header">
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
          <form onSubmit={handleSearch}>
            <div>
              <label>Player Name
                <input type="text" value={playerName} onChange={handlePlayerNameChange} />
              </label>
            </div>
            <div>
              <label>Pro
                <input type="checkbox" onChange={handleProChange} checked={pro}></input>
              </label>
            </div>
            <div>
              <input type="submit" value="Search" />
            </div>
            {searching ? (
              <ContentLoader>
                <rect x="80" y="40" rx="3" ry="3" width="250" height="10" />
                <rect x="80" y="40" rx="3" ry="3" width="250" height="10" />
                <rect x="80" y="40" rx="3" ry="3" width="250" height="10" />
              </ContentLoader>
            ) : (results ? <Results results={results} /> : <p>No Results</p>)}
          </form>
        ) : null}
      </header>
    </div>
  );
}

export default App;
