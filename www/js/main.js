let map = L.map("map").setView([0, 0], 2);
const ADMIN_EMIL = "admin@visitanvil.com";

let colorTileLayer = L.tileLayer("/assets/map/tiles-color/{z}/{x}/{y}.png", {
  minZoom: 0,
  maxZoom: 9,
  noWrap: true,
});
let bwTileLayer = L.tileLayer("/assets/map/tiles-bw/{z}/{x}/{y}.png", {
  minZoom: 0,
  maxZoom: 9,
  noWrap: true,
});
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

function startInteractiveContribution() {
  hidePopup("popup");
  contributeButton.style.backgroundColor = "#ff0000";
  contributeButton.onclick = submit;
  regionsLayer.setStyle({ fillOpacity: 0 });
  regionsLayer.setInteractive(false);
  setTimeout(function () {
    // Stupid, but else the click on the button counts as the first click on the map
    map.on("click", onMouseClick, this);
  }, 1);
}

function toggleMapColor(colors) {
  if (colors) {
    map.removeLayer(bwTileLayer);
    map.addLayer(colorTileLayer);
  } else {
    map.removeLayer(colorTileLayer);
    map.addLayer(bwTileLayer);
  }
}

function toggleRegions(regions) {
  if (regions) {
    regionsLayer.setStyle({ fillOpacity: 0.1 });
  } else {
    regionsLayer.setStyle({ fillOpacity: 0 });
  }
}

let contributeButton = undefined;
let nationsLayer = undefined;
let regionsLayer = undefined;
let poiLayer = undefined;
let poiIsOpen = false;

let nationsRequest = new XMLHttpRequest();
nationsRequest.open("GET", "/assets/map/nations.json");
nationsRequest.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    let regionsRequest = new XMLHttpRequest();
    regionsRequest.open("GET", "/assets/map/regions.json");
    regionsRequest.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        let poiRequest = new XMLHttpRequest();
        poiRequest.open("GET", "/assets/map/poi.json");
        poiRequest.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            let nationsData = JSON.parse(nationsRequest.responseText);
            let regionsData = JSON.parse(regionsRequest.responseText);
            let poiData = JSON.parse(poiRequest.responseText);

            geoJsonCoords = reduceToCoords(objFind(regionsData, "coordinates"));

            nationsLayer = new L.GeoJSON(nationsData, {
              style: function (feature) {
                return {
                  color: feature.properties.color,
                  opacity: 1,
                  weight: 3,
                  fillOpacity: 0,
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
                  fillColor: feature.properties.color,
                  fillOpacity: 0.1,
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
                  e.layer.setStyle({ fillColor: "#3f0", color: "#0f0" });
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

            let toggleColorControl = L.Control.extend({
              options: {
                position: "topleft",
              },

              onAdd: function (map) {
                toggleColorButton = L.DomUtil.create("div", "above-below");
                toggleColorButton.innerHTML = `<div class="center">Colors</div><label class="switch"><input type="checkbox" checked onchange="toggleMapColor(this.checked)"><span class="slider round"></span></label>`;

                let wrapper = L.DomUtil.create("div");
                wrapper.style.position = "relative";
                wrapper.appendChild(toggleColorButton);

                return wrapper;
              },
            });

            map.addControl(new toggleColorControl());

            let toggleRegionsControl = L.Control.extend({
              options: {
                position: "topleft",
              },

              onAdd: function (map) {
                toggleRegionsButton = L.DomUtil.create("div", "above-below");
                toggleRegionsButton.innerHTML = `<div class="center">Regions</div><label class="switch"><input type="checkbox" checked onchange="toggleRegions(this.checked)"><span class="slider round"></span></label>`;

                let wrapper = L.DomUtil.create("div");
                wrapper.style.position = "relative";
                wrapper.appendChild(toggleRegionsButton);

                return wrapper;
              },
            });

            map.addControl(new toggleRegionsControl());

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

  let fmtCoords = coordsToGeoJson(submissionCoords);
  navigator.clipboard.writeText(fmtCoords);
  console.log(fmtCoords);
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
  contributeButton.style.backgroundColor = "#ffffff";
  regionsLayer.setStyle({ fillOpacity: 0.1 });
  regionsLayer.setInteractive(true);
  map.off("click");

  let title = "The Test Nation";
  let subject = `${title} GeoJson Submission`;
  let description = "For centuries I have been testing...";
  let body = `Dear "${
    window.location.hostname
  }" admin,\n\nI have a new are to submit for the "${
    window.location.hostname
  }" website!\n\nArea name: ${title}\nDescription: ${description}\nCoordinates: ${coordsToGeoJson(
    submissionCoords
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
  document.getElementById("map").classList.remove("map-sidebar-closed");
  document.getElementById("map").classList.add("map-sidebar-open");

  //document.getElementById("map").style.width = "60vw";
  document.getElementById("sidebar").classList.add("sidebar-open");
  document.getElementById("sidebar-header").innerText = properties.name;
  document.getElementById("sidebar-content").innerHTML =
    properties.description +
    (properties.url
      ? `<br/><br/>Read more: <a href=${properties.url} target="_blank">${properties.url}</a>`
      : "");
}

function closeNav() {
  poiIsOpen = false;
  onMapZoom();
  document.getElementById("map").classList.remove("map-sidebar-open");
  document.getElementById("map").classList.add("map-sidebar-closed");

  //document.getElementById("map").style.width = "100vw";
  document.getElementById("sidebar").classList.remove("sidebar-open");
}
