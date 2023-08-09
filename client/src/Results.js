import React from "react";
import "./Results.css";

const formatLink = (l) => {
  return l.replace("api/replays", "replay") + "#watch";
};

const formatTitle = (r) => {
  return `${r.map_name} with ${r?.blue?.players?.map(
    (p) => p.name
  )} on blue and ${r?.orange?.players?.map((p) => p.name)} on orange`;
};

const Results = ({ results }) => {
  return Object.entries(results).map(([playerName, playerResults]) => (
    <div key={playerName}>
      <h2>{playerName}</h2>
      {playerResults && playerResults.length ? (
        <ol>
          {playerResults.map((r) => (
            <li key={r.link}>
              <a href={formatLink(r.link)} target="_blank" rel="noreferrer">
                {formatTitle(r)}
              </a>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  ));
};

export default Results;
