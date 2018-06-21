var poiInfo = document.createElement("poiInfoPanel");
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	poiInfo.style.right = "-110%";
	poiInfo.style.width = "100%";
} else {
	poiInfo.style.right = "-50%";
	poiInfo.style.width = "40%";
}

function openPOIInfo(map, properties){
	var innerHTML = "<a href='javascript:void(0)' class='closebtn' onclick='closePOIInfo()'>&times;</a><h2>" + properties.name + "</h2>";
	var description = properties.description;
	if(description){
		innerHTML += "<a>" + description + "</a>"
	}
	var img = properties.image;
	if(img){
		innerHTML += "<img src='images/" + img + "'/>"
	}
	poiInfo.innerHTML = innerHTML;
	poiInfo.style.right = 0;
}


function closePOIInfo(){
	map = map.setActiveArea('poiCloseArea');
	var poiInfo = document.getElementById("poiInfoPanel");
	poiInfo.innerHTML = "";
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		poiInfo.style.right = "-110%";
	} else {
		document.getElementById("map").style.marginRight = "0";
		poiInfo.style.right = "-50%";
	}
}