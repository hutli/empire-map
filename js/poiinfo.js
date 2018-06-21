var poiInfo;

if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	poiInfo.style.right = "-110%";
	poiInfo.style.width = "100%";
} else {
	poiInfo.style.right = "-50%";
	poiInfo.style.width = "40%";
}

function openPOIInfo(map, e, geometryType){
	map = map.setActiveArea('poiOpenArea');
	if(geometryType == "Point"){
		var latlng = e.target.latlng;
		map.flyTo(latlng, 1);
	} else {
		var bounds = e.target.getBounds();
		map.fitBounds(bounds);
	}
	var innerHTML = "<a href='javascript:void(0)' class='closebtn' onclick='closePOIInfo()'>&times;</a><h2>" + e.target.feature.properties.name + "</h2>";
	var description = e.target.feature.properties.description;
	if(description){
		innerHTML += "<a>" + description + "</a>"
	}
	var img = e.target.feature.properties.image;
	if(img){
		innerHTML += "<img src='images/" + img + "'/>"
	}
	poiInfo.innerHTML = innerHTML;
	poiInfo.style.right = 0;
	isFeatureClicked = true;
}


function closePOIInfo(map){
	map = map.setActiveArea('poiCloseArea');
	poiInfo.innerHTML = "";
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		poiInfo.style.right = "-110%";
	} else {
		document.getElementById("map").style.marginRight = "0";
		poiInfo.style.right = "-50%";
	}
}

$(document).ready(function(){
	poiInfo = document.createElement("poiInfoPanel");
	poiInfo.className = "poiInfo";
});