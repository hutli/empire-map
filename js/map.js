/* ------------- CONSTANTS ------------- */
var minZoom = -2;
var nationZoom = -2;
var regionMinZoom = -1;
var poiMinZoom = 1;

var bounds = [[0,0], [4811,6428]];
var image = L.imageOverlay('images/main_bw.png', bounds).addTo(map);

var ignoreList = function(key){
	retValue = key == "name" ? true :
	key == "url" ? true :
	key == "features" ? true :
	key == "image" ? true :
	key == "description" ? true :
	key == "colour" ? true :
	key == "data" ? true :
	key == "type" ? true :
	key == "background" ? true :
	false;
	return retValue;
};

/* ------------- VARIABLES ------------- */
var geojson = new L.geoJson();
var nationsData = {};

var xmlhttp = new XMLHttpRequest();

var map = L.map('map', {
	minZoom: minZoom,
	crs: L.CRS.Simple
});

var highlightImage = undefined;
var ignoreMouseOut = false;

var featureBuffer = new Array();

var savedZoom = minZoom;

var info = L.control();

/* ------------- FUNCTIONS ------------- */
function arrayIncludes(array, element){
	for(var i in array){
		if(array[i].properties.name == element.properties.name){
			return true;
		}
	}
	return false;
}

xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        nationsData = JSON.parse(this.responseText);
        createLayerFromZoom(nationsData);
    }
};

function createMap(data){
	map.removeLayer(geojson);

	geojson = L.geoJson(data, {
	    style: style,
	    onEachFeature: onEachFeature
	}).addTo(map);
}

function style(feature) {
	var colour = feature.properties.colour;
	var background = feature.properties.background;

	var returnObj = {
        weight: 1,
        opacity: 1,
        color: 'black',
        dashArray: '3',
        fillOpacity: 0.5
    };
    
	if(colour){
		returnObj.fillColor = colour;
	}

	return returnObj; 
}


function highlightFeature(e) {
	if(!ignoreMouseOut){
	    var layer = e.target;
	    if(layer.feature.geometry.type == "Polygon" || layer.feature.geometry.type == "MultiPolygon"){
	    	if(layer.feature.properties.background){
				var regionBounds = layer.getBounds();
				highlightImage = L.imageOverlay("images/" + layer.feature.properties.background, regionBounds).addTo(map);
				layer.setStyle({
					fillOpacity: 0
				})
	    	} else {
			    layer.setStyle({
			        weight: 5,
			        color: '#666',
			        dashArray: '',
			        fillOpacity: 0.7
			    });
			}

		    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		        layer.bringToFront();
		    }
		}
	    info.update(layer.feature.properties);
	}
}

function resetHighlight(e) {
	if(!ignoreMouseOut){
		if(e.target.feature.properties.background){
			map.removeLayer(highlightImage);
		} else {
			geojson.resetStyle(e.target);	
		}
	    info.update();
	}
}

function featureClicked(e) {
	var geometryType = e.target.feature.geometry.type;
	if(isCtrlKeyPressed){
		var url = e.target.feature.properties.url;
		if(url){
			window.open(url);
		}
	} else if (isAltKeyPressed || geometryType == "Point"){
		openPOIInfo(map, e);
		var layer = e.target;
		if(layer.feature.geometry.type == "Polygon"){
		    layer.setStyle({
		        weight: 5,
		        color: '#666',
		        dashArray: '',
		        fillOpacity: 0.7
		    });
		    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
		        layer.bringToFront();
		    }
		}
	    info.update(layer.feature.properties);
	} else {
		var newBounds = map.fitBounds(e.target.getBounds());
	}
}

function createLayerFromZoom(data) {
	if(!ignoreMouseOut){
		var newZoom = map.getZoom();
		var mapData = {"type": "FeatureCollection"};
		var toSave = function(type){
			return false;
		};
		if(newZoom >= poiMinZoom) {
			toSave = function(type){
				return type == "region" ? true : type == "poi" ? true : false
			};
		} else if(newZoom >= regionMinZoom){
			toSave = function(type){
				return type == "region" ? true : false;
			};
		} else if(newZoom >= nationZoom){
			toSave = function(type){
				return type == "nation" ? true : false;
			};
		}
		mapData.features = createLayerFromZoomRec(data, toSave, featureBuffer);
		for(var i in featureBuffer){
			mapData.features.push(featureBuffer[i]);
		}
		featureBuffer = new Array();
		createMap(mapData);
	}
}


function createLayerFromZoomRec(data, toSave, ignoreArray){
	var returnArray = new Array();
	if(data.properties){
		if(toSave(data.properties.type) && (!ignoreArray || !arrayIncludes(ignoreArray, data))){
			returnArray.push(data);
		}
		if(data.properties.features && data.properties.features.features){
			var dataFeatures = data.properties.features.features;
			if(dataFeatures){
				for (var i in dataFeatures){
					var dataFeature = dataFeatures[i];
					var dataFeatureArr = createLayerFromZoomRec(dataFeature, toSave, ignoreArray);
					for(var j in dataFeatureArr){
						returnArray.push(dataFeatureArr[j]);
					}
				}
			}
		}
	}

	return returnArray;
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: featureClicked,
    });
}


function openNav() {
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		document.getElementById("map").style.marginLeft = "250px";
	} else {
    	document.getElementById("map").style.marginLeft = "250px";
	}
    document.getElementById("menuButton").onclick = closeNav;
}

function closeNav() {
    document.getElementById("map").style.marginLeft = "0";
    document.getElementById("menuButton").onclick = openNav;
}



/* ------------- ^MAIN ------------- */
xmlhttp.open("GET", "data/geodata.json", true);
xmlhttp.send();

map.on({
	zoomstart: function(e){savedZoom = map.getZoom();},
    zoomend: function(e){createLayerFromZoom(nationsData);},
});

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};

info.update = function (props) {
	var innerHTML = '<h4>Empire Nation Data</h4>'
	if(props){
		innerHTML += '<b>' + props.name + '</b>';
		for (var key in props) {
			if(!ignoreList(key)){
				innerHTML += '<br/>' + key + ': ' + props[key];
			}
        }
	} else {
		innerHTML += 'Hover over a nation'
	}
    this._div.innerHTML = innerHTML;
};