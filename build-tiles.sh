#!/bin/sh
git clone https://github.com/OSGeo/gdal.git

wget https://empirelarpmap.com/assets/map/untiled-bw-x4.png
gdal_translate -of VRT -outsize 131072 131072 untiled-bw-x4.png untiled-bw-translated.vrt
./gdal/swig/python/gdal-utils/scripts/gdal2tiles.py -p raster -s simple -w leaflet --xyz untiled-bw-translated.vrt www/assets/map/tiles-bw

wget https://empirelarpmap.com/assets/map/untiled-color-x4.png
gdal_translate -of VRT -outsize 131072 131072 untiled-color-x4.png untiled-color-translated.vrt
./gdal/swig/python/gdal-utils/scripts/gdal2tiles.py -p raster -s simple -w leaflet --xyz untiled-color-translated.vrt www/assets/map/tiles-color