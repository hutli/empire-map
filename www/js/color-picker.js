function showColorPicker(nation) {
  console.log(nation);
  currentNation = nation;
  currentNationId = `legend-color-box-${nation
    .toLowerCase()
    .replace(" ", "-")}`;
  rgbColor = nations_color_map[nation];
  fillGradient();
  document.getElementById("color-picker-code-display").innerText =
    nations_color_map[nation];
  document
    .getElementsByClassName("color-picker")[0]
    .classList.remove("color-picker-closed");
}

function hideColorPicker() {
  document
    .getElementsByClassName("color-picker")[0]
    .classList.add("color-picker-closed");
}

function click(e) {
  x = e.offsetX;
  y = e.offsetY;
  let imageData = ctx2.getImageData(x, y, 1, 1).data;
  rgbColor = `#${hexByte(imageData[0], 2)}${hexByte(imageData[1], 2)}${hexByte(
    imageData[2],
    2
  )}`;
  fillGradient();
}

function fillGradient() {
  ctx1.fillStyle = rgbColor;
  ctx1.fillRect(0, 0, width1, height1);

  let grdWhite = ctx2.createLinearGradient(0, 0, width1, 0);
  grdWhite.addColorStop(0, "rgba(255,255,255,1)");
  grdWhite.addColorStop(1, "rgba(255,255,255,0)");
  ctx1.fillStyle = grdWhite;
  ctx1.fillRect(0, 0, width1, height1);

  let grdBlack = ctx2.createLinearGradient(0, 0, 0, height1);
  grdBlack.addColorStop(0, "rgba(0,0,0,0)");
  grdBlack.addColorStop(1, "rgba(0,0,0,1)");
  ctx1.fillStyle = grdBlack;
  ctx1.fillRect(0, 0, width1, height1);
}

function mousedown(e) {
  drag = true;
  changeColor(e);
}

function mousemove(e) {
  if (drag) {
    changeColor(e);
  }
}

function mouseup(e) {
  drag = false;
}

function hexByte(num, len) {
  return ("0".repeat(len) + num.toString(16)).substr(-len);
}

function changeColor(e) {
  x = e.offsetX;
  y = e.offsetY;
  let imageData = ctx1.getImageData(x, y, 1, 1).data;
  rgbColor = `#${hexByte(imageData[0], 2)}${hexByte(imageData[1], 2)}${hexByte(
    imageData[2],
    2
  )}`;
  document.getElementById(currentNationId).style.backgroundColor = rgbColor;
  document.getElementById("color-picker-code-display").innerText = rgbColor;
  nations_color_map[currentNation] = rgbColor;
  territoriesLayer.resetStyle();
  nationsLayer.resetStyle();
}

let colorBlock = undefined;
let ctx1 = undefined;
let width1 = undefined;
let height1 = undefined;

let colorStrip = undefined;
let ctx2 = undefined;
let width2 = undefined;
let height2 = undefined;

let colorLabel = undefined;

let x = 0;
let y = 0;
let drag = false;
let rgbColor = "rgba(255,0,0,1)";

let currentNationId = "";
let currentNation = "";

function initColorPicker() {
  colorBlock = document.getElementById("color-block");
  ctx1 = colorBlock.getContext("2d");
  width1 = colorBlock.width;
  height1 = colorBlock.height;

  colorStrip = document.getElementById("color-strip");
  ctx2 = colorStrip.getContext("2d");
  width2 = colorStrip.width;
  height2 = colorStrip.height;

  colorLabel = document.getElementById("color-label");

  ctx1.rect(0, 0, width1, height1);
  fillGradient();

  ctx2.rect(0, 0, width2, height2);
  let grd1 = ctx2.createLinearGradient(0, 0, 0, height1);

  grd1.addColorStop(0, "rgba(255, 0, 0, 1)");
  grd1.addColorStop(0.17, "rgba(255, 255, 0, 1)");
  grd1.addColorStop(0.34, "rgba(0, 255, 0, 1)");
  grd1.addColorStop(0.51, "rgba(0, 255, 255, 1)");
  grd1.addColorStop(0.68, "rgba(0, 0, 255, 1)");
  grd1.addColorStop(0.85, "rgba(255, 0, 255, 1)");
  grd1.addColorStop(1, "rgba(255, 0, 0, 1)");
  ctx2.fillStyle = grd1;
  ctx2.fill();

  colorStrip.addEventListener("click", click, false);
  colorBlock.addEventListener("mousedown", mousedown, false);
  colorBlock.addEventListener("mouseup", mouseup, false);
  colorBlock.addEventListener("mousemove", mousemove, false);
}
