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
  return (
    <ol>
      {results.map((r, i) => (
        <li key={r.link}>
          <a href={formatLink(r.link)} target="_blank" rel="noreferrer">
            {formatTitle(r)}
          </a>
        </li>
      ))}
    </ol>
  );
};

export default Results;
