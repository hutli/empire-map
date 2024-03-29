const ADMIN_EMAIL = "admin@empirelrpmap.com";
const TILE_SERVER_BASE_URL = "https://empirelrpmap.com/";
const GEOJSON_DATA_BASE_URL = "https://empirelrpmap.com/";

let contributionAdminEmailElement = document.getElementById(
  "contribution-admin-email"
);
contributionAdminEmailElement.href = `mailto:${ADMIN_EMAIL}`;
contributionAdminEmailElement.innerText = ADMIN_EMAIL;

let minSize = Math.min(window.innerHeight, window.innerWidth);

let defaultZoomLevel = minSize > 1000 ? 3 : minSize > 600 ? 2 : 1;
let map = L.map("map").setView([0, 0], defaultZoomLevel);

map.attributionControl.addAttribution(
  `Tiles from <a href="mailto:${ADMIN_EMAIL}">hutli</a> &mdash; Source: <a href="https://www.profounddecisions.co.uk/">Profound Decisions</a>`
);

let nations_color_map = {
  Dawn: "#dc133d",
  Highguard: "#aaaaaa",
  "Imperial Orcs": "#1ba3bb",
  Navarr: "#097c63",
  "The Brass Coast": "#f1822e",
  "The League": "#fff413",
  "The Marches": "#79c640",
  Urizen: "#9b2377",
  Varushka: "#a77946",
  Wintermark: "#269dd7",
  "Territory Lost": "#000000",
  "Non-imperial": "#ffffff",
};

// Disabled while developing
if (false && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  toggleDarkMode(true);
} else {
  toggleDarkMode(false);
}

let geoJsonCoords = [];

function objFind(obj, term) {
  let values = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key == term) {
      values.push(value);
    } else if (value && typeof value === "object") {
      let v = objFind(value, term);
      if (v.length > 0) {
        values.push(v);
      }
    }
  }
  return values;
}
function reduceToCoords(arr) {
  return arr.reduce(
    (acc, val) =>
      acc.concat(Array.isArray(val[0][0]) ? reduceToCoords(val) : val),
    []
  );
}

function hidePopup(id) {
  document.getElementById(id).style.display = "none";
}

let territoriesLayerActive = true;
function activateTerritoriesLayer() {
  // Checking before setting for performance
  if (!territoriesLayerActive) {
    territoriesLayer.setInteractive(true);
    territoriesLayerActive = true;
  }
}
function deactivateTerritoriesLayer() {
  // Checking before setting for performance
  if (territoriesLayerActive) {
    territoriesLayer.setInteractive(false);
    territoriesLayerActive = false;
  }
}

let territoriesLayerOpaque = true;
function darkenTerritoriesLayer() {
  // Checking before setting for performance
  if (!territoriesLayerOpaque) {
    territoriesLayer.setStyle({
      fillOpacity: document.getElementById("territory-fill-input").value,
    });
    territoriesLayerOpaque = true;
  }
}
function lightenTerrotiresLayer() {
  // Checking before setting for performance
  if (territoriesLayerOpaque) {
    territoriesLayer.setStyle({
      fillOpacity:
        Number(document.getElementById("territory-fill-input").value) * 0.5,
    });
    territoriesLayerOpaque = false;
  }
}

let wikiArticle = "";
let contributionType = "";

function startInteractiveContribution(contribution) {
  wikiArticle = prompt(
    "Please enter the Empire WiKi URL for the location. If you are submitting the location of a sub-header of an article please include the ID in the URL.",
    ""
  );
  hidePopup("popup");
  if (wikiArticle.includes("profounddecisions.co.uk/empire-wiki/")) {
    contributionType = contribution;
    contributeButton.style.backgroundColor = "#ff0000";
    contributeButton.onclick = submit;
    deactivateTerritoriesLayer();
    lightenTerrotiresLayer();
    setTimeout(function () {
      // Stupid, but else the click on the button counts as the first click on the map
      map.on("click", onMouseClick, this);
    }, 1);
  } else {
    alert(
      "Hmm, that link does not look like an Empire Wikipedia link. Please make sure that you have copied the link directly from the Empire Wikipedia website."
    );
  }
}

function toggleMapColor(colors) {
  if (colors) {
    document.getElementById("terrain-colors-display").innerText = "ON";
    map.removeLayer(bwTileLayer);
    map.addLayer(colorTileLayer);
  } else {
    document.getElementById("terrain-colors-display").innerText = "OFF";
    map.removeLayer(colorTileLayer);
    map.addLayer(bwTileLayer);
  }
}

function changeTerrainOpacity(value) {
  document.getElementById("terrain-opacity-display").innerText =
    Number(value).toFixed(2);
  colorTileLayer.setOpacity(value);
  bwTileLayer.setOpacity(value);
}

function toggleNationBorders(enabled) {
  if (enabled) {
    document.getElementById("nation-borders-display").innerText = "ON";
    nationsLayer.setStyle({ opacity: 1 });
  } else {
    document.getElementById("nation-borders-display").innerText = "OFF";
    nationsLayer.setStyle({ opacity: 0 });
  }
}

function toggleTerritoryBorders(enabled) {
  if (enabled) {
    document.getElementById("territory-borders-display").innerText = "ON";
    territoriesLayer.setStyle({ opacity: 0.5 });
  } else {
    document.getElementById("territory-borders-display").innerText = "OFF";
    territoriesLayer.setStyle({ opacity: 0 });
  }
}

function toggleArmies(enabled) {
  if (enabled) {
    document.getElementById("armies-display").innerText = "ON";
    map.addLayer(armiesLayer);
  } else {
    document.getElementById("armies-display").innerText = "OFF";
    map.removeLayer(armiesLayer);
  }
}

function toggleDarkMode(enabled) {
  if (enabled) {
    document.getElementById("dark-mode").innerText = "ON";
    tileMapDir = "map-dark";
  } else {
    document.getElementById("dark-mode").innerText = "OFF";
    tileMapDir = "map";
  }

  colorTileLayer = L.tileLayer(
    `${TILE_SERVER_BASE_URL}assets/${tileMapDir}/tiles-color/{z}/{x}/{y}.png`,
    {
      minZoom: 0,
      maxZoom: 9,
      opacity: 1,
      noWrap: true,
    }
  );
  bwTileLayer = L.tileLayer(
    `${TILE_SERVER_BASE_URL}assets/${tileMapDir}/tiles-bw/{z}/{x}/{y}.png`,
    {
      minZoom: 0,
      maxZoom: 9,
      opacity: 1,
      noWrap: true,
    }
  );

  toggleMapColor(
    document.getElementById("terrain-colors-display-input").checked
  );
}

function changeTerritoryFill(value) {
  document.getElementById("territory-fill-display").innerText =
    Number(value).toFixed(2);
  territoriesLayer.setStyle({ fillOpacity: value });
}

function toggleLegend() {
  let legend = document.getElementsByClassName("legend")[0];
  legend.classList.toggle("legend-closed");
  if (
    document.defaultView.getComputedStyle(
      document.getElementsByClassName("legend")[0]
    )["transform"] == "matrix(1, 0, 0, 1, 0, 0)"
  ) {
    hideColorPicker();
  }
}

let markerIconRedDot = L.icon({
  iconUrl: "../images/icons/marker-icon-red.png",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function isSmartphone() {
  return window.matchMedia("only screen and (max-width: 760px)").matches;
}

function moveToLocation(latlng, title, map) {
  map.setView(
    latlng,
    latlng.layer.feature.geometry.type == "Polygon"
      ? map.getBoundsZoom(latlng.layer.getBounds())
      : 7
  );
}

function fuzzyFilterData(text, records) {
  return fuzzysort
    .go(
      text,
      Object.keys(records).map((k) => {
        return {
          name: k,
          D: records[k],
        };
      }),
      {
        limit: 10,
        allowTypo: true,
        threshold: -10000, // don't return bad results
        key: "name",
      }
    )
    .reduce((a, v) => ({ ...a, [v.obj.name]: v.obj.D }), {});
}

function onLocationFound(e) {
  if (e.layer._popup) {
    e.layer.openPopup();
  } else {
    console.warn(`Layer for "${e.layer.feature.properties.name}" has no popup`);
  }
}

function showTerritoryNames() {
  console.log(`Showing territories layer (${map.getZoom()})`);
  Object.values(territoriesLayer._layers).reduce((_, l) => {
    let tooltip = l.getTooltip();
    l.unbindTooltip().bindTooltip(tooltip, {
      permanent: true,
    });
  });
}

function hideTerritoryNames() {
  console.log(`Hiding territories layer (${map.getZoom()})`);
  Object.values(territoriesLayer._layers).reduce((_, l) => {
    let tooltip = l.getTooltip();
    l.unbindTooltip().bindTooltip(tooltip, {
      permanent: false,
    });
  });
}

let contributeButton = undefined;

let nationsLayer = undefined;
let territoriesLayer = undefined;
let poiLayer = undefined;
let armiesLayer = undefined;

let poiIsOpen = false;

let nationsRequest = new XMLHttpRequest();
nationsRequest.open("GET", `${GEOJSON_DATA_BASE_URL}assets/map/nations.json`);
nationsRequest.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    let territoriesRequest = new XMLHttpRequest();
    territoriesRequest.open(
      "GET",
      `${GEOJSON_DATA_BASE_URL}assets/map/territories.json`
    );
    territoriesRequest.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let poiRequest = new XMLHttpRequest();
        poiRequest.open("GET", `${GEOJSON_DATA_BASE_URL}assets/map/poi.json`);
        poiRequest.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            let armiesRequest = new XMLHttpRequest();
            armiesRequest.open(
              "GET",
              `${GEOJSON_DATA_BASE_URL}assets/map/armies.json`
            );
            armiesRequest.onreadystatechange = function () {
              if (this.readyState == 4 && this.status == 200) {
                let nationsData = JSON.parse(nationsRequest.responseText);
                let territoriesData = JSON.parse(
                  territoriesRequest.responseText
                );
                let poiData = JSON.parse(poiRequest.responseText);
                let armiesData = JSON.parse(armiesRequest.responseText);

                geoJsonCoords = reduceToCoords(
                  objFind(territoriesData, "coordinates")
                );

                nationsLayer = new L.GeoJSON(nationsData, {
                  style: function (feature) {
                    return {
                      color: nations_color_map[feature.properties.nation],
                      opacity: 1,
                      weight: 3,
                      fillOpacity: 0,
                      interactive: false,
                    };
                  },
                  onEachFeature: function (feature, marker) {
                    marker.bindPopup(`<h2>${feature.properties.name}</h2>`);
                  },
                });

                territoriesLayer = new L.GeoJSON(territoriesData, {
                  style: function (feature) {
                    return {
                      color: "#000000",
                      opacity: 0.5,
                      weight: 1,
                      fillColor: nations_color_map[feature.properties.nation],
                      fillOpacity: document.getElementById(
                        "territory-fill-input"
                      ).value,
                    };
                  },
                  onEachFeature: function (feature, marker) {
                    let featureName = `${feature.properties.name} (${feature.properties.nation})`;
                    marker.bindPopup(`<h2>${featureName}</h2>`);
                    marker.bindTooltip(featureName, {
                      permanent: false,
                      direction: "center",
                      className: "territories-tooltip",
                    });
                  },
                });

                poiLayer = new L.GeoJSON(poiData, {
                  onEachFeature: function (feature, marker) {
                    if (feature.properties.icon == "RedDot") {
                      marker.setIcon(markerIconRedDot);
                    }
                    marker.bindPopup(
                      `<h2>${feature.properties.name} (${feature.properties.nation})</h2>`
                    );
                  },
                });

                armiesLayer = new L.GeoJSON(armiesData, {
                  onEachFeature: function (feature, marker) {
                    let icon = L.icon({
                      iconUrl: `../${feature.properties.icon}`,
                      iconSize: [50, 50],
                      iconAnchor: [25, 25],
                    });
                    marker.setIcon(icon);
                    marker.bindPopup(
                      `<h2>${feature.properties.army} (${feature.properties.nation})</h2>`
                    );
                  },
                });

                let all_layer = L.featureGroup([
                  territoriesLayer,
                  nationsLayer,
                  poiLayer,
                  armiesLayer,
                ]);

                // ADD MAP CONTROLS
                let searchControl = new L.Control.Search({
                  layer: all_layer,
                  propertyName: "name",
                  marker: false,
                  firstTipSubmit: true,
                  moveToLocation: moveToLocation,
                  filterData: fuzzyFilterData,
                });

                searchControl.on("search:locationfound", onLocationFound);
                map.addControl(searchControl);

                if (location.hash.length > 1) {
                  // More than just "#"
                  let lookupStr = decodeURI(location.hash.slice(1));
                  let searchResults = fuzzyFilterData(
                    lookupStr,
                    Object.values(all_layer._layers).reduce(
                      (a0, v0) => ({
                        ...a0,
                        ...Object.values(v0._layers).reduce(
                          (a1, v1) => ({
                            ...a1,
                            [v1.feature.properties.name]: v1,
                          }),
                          {}
                        ),
                      }),
                      {}
                    )
                  );
                  if (Object.entries(searchResults).length > 0) {
                    let searchResult = Object.values(searchResults)[0];
                    let isPolygon =
                      searchResult.feature.geometry.type == "Polygon";
                    let center = isPolygon
                      ? searchResult.getBounds().getCenter()
                      : {
                          lng: searchResult.feature.geometry.coordinates[0],
                          lat: searchResult.feature.geometry.coordinates[1],
                        };
                    searchResult = {
                      layer: searchResult,
                      ...center,
                    };
                    onLocationFound(searchResult);
                    moveToLocation(searchResult, undefined, map);
                    if (isPolygon) {
                      map.removeLayer(poiLayer); // Search control automatically adds its layers
                      map.removeLayer(armiesLayer);
                    }
                  } else {
                    console.warn(
                      `Search for "${lookupStr}" yeilded no results (link broken)`
                    );
                    map.removeLayer(poiLayer); // Search control automatically adds its layers
                    map.removeLayer(armiesLayer);
                  }
                } else {
                  map.removeLayer(poiLayer); // Search control automatically adds its layers
                  map.removeLayer(armiesLayer);
                }

                if (isSmartphone()) {
                  deactivateTerritoriesLayer();
                }

                let contributeControl = L.Control.extend({
                  options: {
                    position: "topleft",
                  },

                  onAdd: function (map) {
                    contributeButton = L.DomUtil.create(
                      "button",
                      "contribute-button"
                    );

                    contributeButton.onclick = (e) => {
                      document.getElementById("popup").style.display = "block";
                    };

                    let wrapper = L.DomUtil.create("div");
                    wrapper.style.position = "relative";
                    wrapper.appendChild(contributeButton);

                    return wrapper;
                  },
                });

                map.addControl(new contributeControl());

                let sidebar = L.control.sidebar("sidebar", {
                  position: "left",
                });
                map.addControl(sidebar);

                let legend = L.control({ position: "topright" });

                legend.onAdd = function (map) {
                  let div = L.DomUtil.create("div", "legend");
                  L.DomEvent.disableClickPropagation(div);

                  div.innerHTML =
                    Object.entries(nations_color_map).reduce(
                      (agg, e) =>
                        `${agg}<div class="legend-row"><div id="legend-color-box-${e[0]
                          .toLowerCase()
                          .replace(
                            " ",
                            "-"
                          )}" class="legend-color-box" style="background-color: ${
                          e[1]
                        };" onclick="showColorPicker('${
                          e[0]
                        }')"></div><h3 class="legend-title">${e[0]}</h3></div>`,
                      ""
                    ) +
                    '<h2 class="legend-close-btn" onclick="toggleLegend()">&#9650;</h2>';
                  return div;
                };

                map.addControl(legend);

                let colorPicker = L.control({ position: "topright" });

                colorPicker.onAdd = function (map) {
                  let div = L.DomUtil.create(
                    "div",
                    "color-picker color-picker-closed"
                  );
                  L.DomEvent.disableClickPropagation(div);

                  div.innerHTML = `<button class="color-picker-close-btn" onclick="hideColorPicker()">&#x2715;</button><canvas id="color-block" height="150" width="150"></canvas><canvas id="color-strip" height="150" width="30"></canvas><h3 id="color-picker-code-display">#000000</h3>`;

                  return div;
                };
                map.addControl(colorPicker);
                initColorPicker();
              }
            };
            armiesRequest.send(null);
          }
        };
        poiRequest.send(null);
      }
    };
    territoriesRequest.send(null);
  }
};
nationsRequest.send(null);

let coordinateControl = new (L.Control.extend({
  onAdd: function () {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
  },

  update: function (coords) {
    this._div.innerHTML = coords
      ? `${coords.lng.toFixed(2)} : ${coords.lat.toFixed(2)}`
      : coords;
  },
}))();

coordinateControl.setPosition("bottomleft");

map.addControl(coordinateControl);

let submissionCoords = [];
let submissionPolygon = L.polygon(submissionCoords);
let submissionMarker = undefined;
map.addLayer(submissionPolygon);

const onMouseMove = function (e) {
  coordinateControl.update(e.latlng);
};

function coordsToGeoJson(coords) {
  return JSON.stringify(coords.map(([lat, lng]) => [lng, lat]));
}

const onMouseClick = function (e) {
  let lng = Number(e.latlng.lng.toFixed(2));
  let lat = Number(e.latlng.lat.toFixed(2));
  if (contributionType == "point-of-interest") {
    if (submissionMarker) {
      map.removeLayer(submissionMarker);
    }
    submissionMarker = L.marker([lat, lng]);
    map.addLayer(submissionMarker);
  } else {
    if (e.originalEvent.ctrlKey) {
      let closest = [null, Infinity];
      for (let [x, y] of geoJsonCoords) {
        let distance = Math.sqrt(Math.pow(lng - x, 2) + Math.pow(lat - y, 2));
        if (distance < closest[1]) {
          closest = [[x, y], distance];
        }
      }
      [lng, lat] = closest[0];
    }

    submissionCoords.push([lat, lng]);

    map.removeLayer(submissionPolygon);
    submissionPolygon = L.polygon(submissionCoords);
    map.addLayer(submissionPolygon);
  }
};

function onMapZoom() {
  let zoomLevel = map.getZoom();
  if (zoomLevel >= 4 && !map.hasLayer(poiLayer)) {
    map.addLayer(poiLayer);
  } else if (zoomLevel < 4 && map.hasLayer(poiLayer) && !poiIsOpen) {
    map.removeLayer(poiLayer);
  }
  if (zoomLevel < 4 && !isSmartphone()) {
    activateTerritoriesLayer();
  } else {
    deactivateTerritoriesLayer();
  }
  if (zoomLevel >= 5) {
    lightenTerrotiresLayer();
  } else {
    darkenTerritoriesLayer();
  }

  if (zoomLevel >= 4 || (zoomLevel >= 3 && isSmartphone())) {
    showTerritoryNames();
  } else {
    hideTerritoryNames();
  }
}

map.on("mousemove", onMouseMove, this);
map.on("popupopen", openNav, this);
map.on("popupclose", closeNav, this);
map.on("zoomend", onMapZoom);

function submit() {
  contributeButton.onclick = (e) => {
    document.getElementById("popup").style.display = "block";
  };
  contributeButton.style.backgroundColor = "#ffffff";
  activateTerritoriesLayer();
  darkenTerritoriesLayer();
  map.off("click");

  let geometryGeoJson = {
    type: "Feature",
    properties: {
      url: wikiArticle,
    },
    geometry: { type: "", coordinates: [] },
  };

  if (submissionPolygon) {
    map.removeLayer(submissionPolygon);
    geometryGeoJson.geometry.type = "Polygon";
    geometryGeoJson.geometry.coordinates = [coordsToGeoJson(submissionCoords)];
    submissionCoords = [];
    submissionPolygon = L.polygon([]);
  }
  if (submissionMarker) {
    map.removeLayer(submissionMarker);

    geometryGeoJson.geometry.type = "Point";
    geometryGeoJson.geometry.coordinates = [
      submissionMarker._latlng.lng,
      submissionMarker._latlng.lat,
    ];
    submissionMarker = undefined;
  }

  let subject = `${contributionType} GeoJson Submission`;
  let body = `Dear "${
    window.location.hostname
  }" admin,\n\nI have a "${contributionType}" to submit for the "${
    window.location.hostname
  }" website!\n\n-------------------------\n\n${JSON.stringify(
    geometryGeoJson,
    null,
    2
  )}`;
  window.open(
    `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`,
    "_blank"
  );
}
const resizeObserver = new ResizeObserver(() => {
  map.invalidateSize();
});

const mapDiv = document.getElementById("map");
resizeObserver.observe(mapDiv);

function openNav(e) {
  let layer = e.popup._source;
  let feature = layer.feature;
  let properties = feature.properties;

  if (layer.setStyle) {
    layer.setStyle({
      fillColor: "#3f0",
      color: "#0f0",
      fillOpacity: 0.25,
    });
  }
  deactivateTerritoriesLayer();
  location.hash = `#${properties.name}`;

  if (feature.geometry.type == "Point") {
    poiIsOpen = true;
  }

  document.getElementById("map").classList.remove("map-infobar-closed");
  document.getElementById("map").classList.add("map-infobar-open");

  document.getElementById("infobar").classList.add("infobar-open");
  document.getElementById("infobar-header").innerText = properties.name;
  document.getElementById("infobar-content").innerHTML =
    properties.description +
    (properties.url
      ? `<br/><br/>Read more: <a href=${properties.url} target="_blank">${properties.url}</a>`
      : "");
}

function closeNav() {
  territoriesLayer.eachLayer(function (layer) {
    //restore feature color
    if (territoriesLayerOpaque) {
      territoriesLayer.resetStyle(layer);
    }
  });
  nationsLayer.eachLayer(function (layer) {
    //restore feature color
    nationsLayer.resetStyle(layer);
  });
  location.hash = "";

  poiIsOpen = false;
  onMapZoom();
  document.getElementById("map").classList.remove("map-infobar-open");
  document.getElementById("map").classList.add("map-infobar-closed");

  //document.getElementById("map").style.width = "100vw";
  document.getElementById("infobar").classList.remove("infobar-open");
}
