var isCtrlKeyPressed = false;
var isAltKeyPressed = false;

function sideNavClick(t, e){
	if(e.ctrlKey){
		return true;
	} else {
		return false;
	}
}