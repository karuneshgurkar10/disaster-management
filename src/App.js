import axios from "axios";
import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleQuantile } from "d3-scale";
import ReactTooltip from "react-tooltip";

import "./App.css";

const INDIA_TOPO_JSON = require("./india.topo.json");

const PROJECTION_CONFIG = {
  scale: 350,
  center: [78.9629, 22.5937] // always in [East Latitude, North Longitude]
};

// Red Variants
const COLOR_RANGE = [
  "#ffedea",
  "#ffcec5",
  "#ffad9f",
  "#ff8a75",
  "#ff5533",
  "#e2492d",
  "#be3d26",
  "#9a311f",
  "#782618"
];

const DEFAULT_COLOR = "#EEE";

const geographyStyle = {
  default: {
    outline: "none"
  },
  hover: {
    fill: "#ccc",
    transition: "all 250ms",
    outline: "none"
  },
  pressed: {
    outline: "none"
  }
};

function App() {
  const [tooltipContent, setTooltipContent] = useState("");
  const [data, setData] = useState([]);
  const [testData, setTestData] = useState([]);

  useEffect(() => {
    getStatewiseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatewiseData = async () => {
    try {
      const [
        { data: dataResponse },
        { data: stateTestResponse }
      ] = await Promise.all([
        axios.get("https://api.covid19india.org/data.json"),
        axios.get("https://api.covid19india.org/state_test_data.json")
      ]);
      const states = dataResponse.statewise;
      setData(states);
      const statesTests = stateTestResponse.states_tested_data;
      setTestData(statesTests.filter(obj => obj.totaltested !== ""));
    } catch (error) {
      console.log(error);
    }
  };

  const colorScale = scaleQuantile()
    .domain(data.map(d => d.active))
    .range(COLOR_RANGE);

  const onMouseEnter = (geo, current = { value: "NA" }, totaltested = "-") => {
    return () => {
      const tooltip = `<span class="icon-marker">
      <span class="icon-marker-tooltip">
        <h2>${geo.properties.name}</h2>
        <ul>
        <li><strong>Active:</strong> ${current.active}</li>
          <li><strong>Confirmed:</strong> ${current.confirmed}</li>
          <li><strong>Deaths:</strong> ${current.deaths}</li>
          <li><strong>Recovered:</strong> ${current.recovered}</li>
          <li><strong>Tested:</strong> ${totaltested}</li>
        </ul>
      </span>
      </span>`;
      setTooltipContent(tooltip);
    };
  };

  const onMouseLeave = () => {
    setTooltipContent("");
  };

  return (
    <div className="full-width-height container">
      <h1 className="no-margin center">Corana Tracker </h1>
      <ReactTooltip html={true}>{tooltipContent}</ReactTooltip>
      <ComposableMap
        projectionConfig={PROJECTION_CONFIG}
        projection="geoMercator"
        width={600}
        height={220}
        data-tip=""
      >
        <Geographies geography={INDIA_TOPO_JSON}>
          {({ geographies }) =>
            geographies.map(geo => {
              const current = data.find(s => s.statecode === geo.id);
              let totalTests;

              if (current !== undefined) {
                totalTests = testData.find(x => x.state === current.state);
              }
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={current ? colorScale(current.active) : DEFAULT_COLOR}
                  style={geographyStyle}
                  onMouseEnter={onMouseEnter(
                    geo,
                    current,
                    totalTests !== undefined && totalTests.totaltested
                  )}
                  onMouseLeave={onMouseLeave}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

export default App;
