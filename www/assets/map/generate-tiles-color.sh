#!/bin/sh
rm -r tiles
rm *.jpeg
rm *.xml
rm *.vrt
gdal_translate -of VRT -outsize 131072 131072 untiled-color-x4.png untiled-translated.vrt
#/home/hutli/gdal/swig/python/scripts/gdalwarp -te 0 0 131072 131072 untiled-resized.jpeg untiled-resized-warped.jpeg
#gdalwarp -te 0 0 131072 131072 untiled-translated.vrt untiled-translated-warped.vrt
mv untiled-translated.vrt untiled-translated-warped.vrt
/home/hutli/gdal/swig/python/gdal-utils/scripts/gdal2tiles.py -p raster -s simple -w leaflet --xyz untiled-translated-warped.vrt tiles-color