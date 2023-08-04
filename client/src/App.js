import { useEffect, useState } from 'react';
import './App.css';

function App() {

  const [workingApiKey, setWorkingApiKey] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (apiKey.length > 0) {
      console.log("fetching...")
      fetch("/api", {
        headers: {
          "Authorization": apiKey,
        },
      })
        .then((res) => res.json())
        .then((data) => console.log("server responds ok?", data.ok));

      fetch("/user", {
        headers: {
          id: "76561198442110983"
        },
      })
        .then((res) => res.json())
        .then((data) => console.log("user replays:", data.data.data.list));
    }


  }, [apiKey])

  const handleChange = (event) => {
    setWorkingApiKey(event.target.value);
  }

  const handleSubmit = (e) => {
    console.log("saving", workingApiKey)
    setApiKey(workingApiKey);
    e.preventDefault();
  }

  return (
    <div className="App">
      <header className="App-header">
        <form onSubmit={handleSubmit}>
          <div>
            <label>Enter Your Ballchasing API Key
              <input type="text" value={workingApiKey} onChange={handleChange} />
            </label>
          </div>
          <div>
            <input type="submit" value="Submit" />
          </div>
        </form>
      </header>
    </div>
  );
}

export default App;
