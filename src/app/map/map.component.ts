import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { tileLayer, latLng, latLngBounds, circle, polygon, marker, Map, MapOptions, ZoomAnimEvent, Control, DomUtil, } from 'leaflet';
import 'leaflet-mouse-position';
import { LeafletControlLayersChanges } from '@asymmetrik/ngx-leaflet';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() map$: EventEmitter<Map> = new EventEmitter;
  @Output() zoom$: EventEmitter<number> = new EventEmitter;
  @Output() control$: EventEmitter<Control> = new EventEmitter;
  @Input() options: MapOptions = {
    layers: [
      tileLayer('/assets/map/untiled.png', {
        maxNativeZoom: -3,
        minNativeZoom: -3,
        minZoom: -3,
        maxZoom: 10,
        noWrap: true,
        tileSize: 800,
        bounds: latLngBounds(latLng(0, 0), latLng(6428, 4811))
      }),
      circle([46.95, -122], { radius: 5000 }),
      polygon([[46.8, -121.85], [46.92, -121.92], [46.87, -121.8]]),
      marker([46.879966, -121.726909])
    ],
    zoom: 0,
    center: latLng(0, 0)
  }

  public map: Map;
  public zoom: number;

  public mouseLocation: HTMLElement

  constructor() { }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.map.clearAllEventListeners;
    this.map.remove();
  }


  onMapReady(map: Map) {
    this.map = map;
    this.map$.emit(map);
    this.zoom = map.getZoom();
    this.zoom$.emit(this.zoom);
    this.map.addEventListener('click', function (ev) {
      //alert("TEST!");
      this.mouseLocation.innerText = "Updated";
    })

    var customControl = Control.extend({
      options: {
        position: 'bottomleft'
      },

      onAdd: function (map) {
        this.mouseLocation = DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        this.mouseLocation.style.backgroundColor = 'white';
        this.mouseLocation.style.backgroundSize = "30px 30px";
        this.mouseLocation.style.padding = '3px';
        this.mouseLocation.title = 'Mouse location';
        this.mouseLocation.innerText = "Content!";

        return this.mouseLocation;
      }
    });

    this.map.addControl(new customControl());
  }

  onControlReady(control: Control) {
    alert("Control ready!");
  }

  onMapZoomEnd(e: ZoomAnimEvent) {
    this.zoom = e.target.getZoom();
    this.zoom$.emit(this.zoom);
  }
}