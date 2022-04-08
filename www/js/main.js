const ADMIN_EMIL = "admin@empirelarpmap.com";
const TILE_SERVER_BASE_URL = "https://empirelarpmap.com/";
const GEOJSON_DATA_BASE_URL = "https://empirelarpmap.com/";

let map = L.map("map").setView([0, 0], 2);

map.attributionControl.addAttribution(
  `Tiles from <a href="mailto:${ADMIN_EMIL}">Jens</a> &mdash; Source: <a href="https://www.profounddecisions.co.uk/">Profound Decisions</a>`
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
  "Region Lost": "#000000",
};

let colorTileLayer = L.tileLayer(
  `${TILE_SERVER_BASE_URL}assets/map/tiles-color/{z}/{x}/{y}.png`,
  {
    minZoom: 0,
    maxZoom: 9,
    opacity: 1,
    noWrap: true,
  }
);
let bwTileLayer = L.tileLayer(
  `${TILE_SERVER_BASE_URL}assets/map/tiles-bw/{z}/{x}/{y}.png`,
  {
    minZoom: 0,
    maxZoom: 9,
    opacity: 1,
    noWrap: true,
  }
);
map.addLayer(colorTileLayer);

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
    regionsLayer.setStyle({ fillOpacity: 0 });
    regionsLayer.setInteractive(false);
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

function toggleRegionBorders(enabled) {
  if (enabled) {
    document.getElementById("region-borders-display").innerText = "ON";
    regionsLayer.setStyle({ opacity: 0.5 });
  } else {
    document.getElementById("region-borders-display").innerText = "OFF";
    regionsLayer.setStyle({ opacity: 0 });
  }
}

function changeRegionFill(value) {
  document.getElementById("region-fill-display").innerText =
    Number(value).toFixed(2);
  regionsLayer.setStyle({ fillOpacity: value });
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

let contributeButton = undefined;
let nationsLayer = undefined;
let regionsLayer = undefined;
let poiLayer = undefined;
let poiIsOpen = false;

let nationsRequest = new XMLHttpRequest();
nationsRequest.open("GET", `${GEOJSON_DATA_BASE_URL}assets/map/nations.json`);
nationsRequest.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    let regionsRequest = new XMLHttpRequest();
    regionsRequest.open(
      "GET",
      `${GEOJSON_DATA_BASE_URL}assets/map/regions.json`
    );
    regionsRequest.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let poiRequest = new XMLHttpRequest();
        poiRequest.open("GET", `${GEOJSON_DATA_BASE_URL}assets/map/poi.json`);
        poiRequest.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            let nationsData = JSON.parse(nationsRequest.responseText);
            let regionsData = JSON.parse(regionsRequest.responseText);
            let poiData = JSON.parse(poiRequest.responseText);

            geoJsonCoords = reduceToCoords(objFind(regionsData, "coordinates"));

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

            regionsLayer = new L.GeoJSON(regionsData, {
              style: function (feature) {
                return {
                  color: "#000000",
                  opacity: 0.5,
                  weight: 1,
                  fillColor: nations_color_map[feature.properties.nation],
                  fillOpacity: 0.25,
                };
              },
              onEachFeature: function (feature, marker) {
                marker.bindPopup(
                  `<h2>${feature.properties.name} (${feature.properties.nation})</h2>`
                );
              },
            });

            poiLayer = new L.GeoJSON(poiData, {
              onEachFeature: function (feature, marker) {
                marker.bindPopup(
                  `<h2>${feature.properties.name} (${feature.properties.nation})</h2>`
                );
              },
            });

            // ADD MAP CONTROLS
            let searchControl = new L.Control.Search({
              layer: L.featureGroup([regionsLayer, nationsLayer, poiLayer]),
              propertyName: "name",
              marker: false,
              firstTipSubmit: true,
              moveToLocation: function (latlng, title, map) {
                map.setView(
                  latlng,
                  latlng.layer.feature.geometry.type == "Polygon"
                    ? map.getBoundsZoom(latlng.layer.getBounds())
                    : 8
                );
              },
            });

            searchControl
              .on("search:locationfound", function (e) {
                if (e.layer.setStyle) {
                  e.layer.setStyle({
                    fillColor: "#3f0",
                    color: "#0f0",
                    fillOpacity: 0.25,
                  });
                }
                if (e.layer._popup) {
                  e.layer.openPopup();
                }
              })
              .on("search:collapsed", function (e) {
                regionsLayer.eachLayer(function (layer) {
                  //restore feature color
                  regionsLayer.resetStyle(layer);
                });
                nationsLayer.eachLayer(function (layer) {
                  //restore feature color
                  nationsLayer.resetStyle(layer);
                });
              });
            map.addControl(searchControl);

            map.removeLayer(poiLayer); // Search control automatically adds its layers

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
        poiRequest.send(null);
      }
    };
    regionsRequest.send(null);
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
  if (map.getZoom() >= 4 && !map.hasLayer(poiLayer)) {
    map.addLayer(poiLayer);
  } else if (map.getZoom() < 4 && map.hasLayer(poiLayer) && !poiIsOpen) {
    map.removeLayer(poiLayer);
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
  regionsLayer.setStyle({ fillOpacity: 0.25 });
  regionsLayer.setInteractive(true);
  map.off("click");

  let geometryGeoJson = {
    type: "Feature",
    properties: {
      url: wikiArticle,
      nation: "",
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
    `mailto:${ADMIN_EMIL}?subject=${encodeURIComponent(
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
  let feature = e.popup._source.feature;
  let properties = feature.properties;

  if (feature.geometry.type == "Point") {
    poiIsOpen = true;
  }

  console.log(`Opening Nav`);
  document.getElementById("map").classList.remove("map-infobar-closed");
  document.getElementById("map").classList.add("map-infobar-open");

  //document.getElementById("map").style.width = "60vw";
  document.getElementById("infobar").classList.add("infobar-open");
  document.getElementById("infobar-header").innerText = properties.name;
  document.getElementById("infobar-content").innerHTML =
    properties.description +
    (properties.url
      ? `<br/><br/>Read more: <a href=${properties.url} target="_blank">${properties.url}</a>`
      : "");
}

function closeNav() {
  poiIsOpen = false;
  onMapZoom();
  document.getElementById("map").classList.remove("map-infobar-open");
  document.getElementById("map").classList.add("map-infobar-closed");

  //document.getElementById("map").style.width = "100vw";
  document.getElementById("infobar").classList.remove("infobar-open");
}
