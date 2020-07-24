import { Component } from '@angular/core';
import { tileLayer, latLng, latLngBounds, circle, polygon, marker, Map, MapOptions, Control, DomUtil, LatLng, LeafletMouseEvent, CRS, LatLngBounds, } from 'leaflet';
import 'leaflet-mouse-position';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent {
  minMapZoom = 0;
  maxMapZoom = 5;

  options: MapOptions = {
    layers: [
      tileLayer('/assets/map/{z}/{x}/{y}.png', {
        tms: true,
        //minNativeZoom: this.minMapZoom,
        //maxNativeZoom: this.maxMapZoom,
        minZoom: this.minMapZoom,
        maxZoom: this.maxMapZoom,
        noWrap: true,
        //bounds: latLngBounds(latLng(8192, 0), latLng(0, 8192)),
      }),
      //circle([0, 0], { radius: 50000 }),
      //polygon([[46.8, -121.85], [46.92, -121.92], [46.87, -121.8]]),
      //marker([46.879966, -121.726909])
    ],
    minZoom: this.minMapZoom,
    maxZoom: this.maxMapZoom,
    //crs: CRS.Simple,
    //maxBounds: new LatLngBounds(latLng(0, 8192, this.maxMapZoom), latLng(8192, 0, this.maxMapZoom)),
    //zoom: 3,
    //center: latLng(4096, -4096),
  }

  constructor() { }

  onMapReady(map: Map) {
    var coordinateControl = new (Control.extend({

      onAdd: function () {
        this._div = DomUtil.create('div', 'info');
        this.update();
        return this._div;
      },

      update: function (coords: LatLng) {
        this._div.innerHTML = coords ? `${coords.lat.toFixed(2)} : ${coords.lng.toFixed(2)}` : coords;
      },
    }));

    var mapBounds = new LatLngBounds(
      map.unproject([0, 8192], this.maxMapZoom),
      map.unproject([8192, 0], this.maxMapZoom));

    map.fitBounds(mapBounds);

    coordinateControl.setPosition('bottomleft');

    map.addControl(coordinateControl);

    const onMouseMove = function (e: LeafletMouseEvent) {
      coordinateControl.update(e.latlng);
    }

    map.on('mousemove', onMouseMove, this);
  }
}