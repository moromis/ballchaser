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
            <React.Fragment key={r.link} className="result">
              <li className="link">
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
                {clickedLinks.find((l) => l === r.link) ? (
                  <Icon icon="tick" className="tick" />
                ) : null}
              </li>
              <div>
                {r?.orange?.players?.map((p) => (
                  <Tag key={`${r.id}${p.name}`} round className="orange-player">
                    {p.name}
                  </Tag>
                ))}
                {r?.blue?.players?.map((p) => (
                  <Tag key={`${r.id}${p.name}`} round className="blue-player">
                    {p.name}
                  </Tag>
                ))}
              </div>
            </React.Fragment>
          ))}
        </ol>
      ) : null}
    </div>
  ));
};

export default Results;
