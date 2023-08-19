import { Icon, Tag } from "@blueprintjs/core";
import React, { useState } from "react";
import "./Results.css";

const formatLink = (l) => {
  return l.replace("api/replays", "replay") + "#watch";
};

const formatTitle = (r) => {
  return r.replay_title;
};

const Results = ({ results }) => {
  const [clickedLinks, setClickedLinks] = useState([]);

  const clickLink = (link) => {
    setClickedLinks((prevLinks) => prevLinks.concat(link));
  };

  return Object.entries(results).map(([playerName, playerResults]) => (
    <div key={playerName}>
      <h2>{playerName}</h2>
      {playerResults && playerResults.length ? (
        <ol>
          {playerResults.map((r) => (
            <li key={r.link}>
              <div className="result">
                <span className="link">
                  {clickedLinks.find((l) => l === r.link) ? (
                    <Icon icon="tick" className="tick" />
                  ) : null}
                  <div>
                    <a
                      href={formatLink(r.link)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => clickLink(r.link)}
                    >
                      {formatTitle(r)}
                    </a>
                  </div>
                </span>
                <div>
                  {r?.orange?.players?.map((p) => (
                    <Tag
                      key={`${r.id}${p.name}`}
                      round
                      className="player orange-player"
                    >
                      {p.name}
                    </Tag>
                  ))}
                  {r?.blue?.players?.map((p) => (
                    <Tag
                      key={`${r.id}${p.name}`}
                      round
                      className="player blue-player"
                    >
                      {p.name}
                    </Tag>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  ));
};

export default Results;
