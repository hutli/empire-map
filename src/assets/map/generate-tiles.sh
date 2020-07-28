#!/bin/sh
rm -r tiles
rm *.jpeg
rm *.xml
rm *.vrt
gdal_translate -of VRT -outsize 8192 8192 untiled.png untiled-translated.vrt
#/home/hutli/gdal-3.1.2/swig/python/scripts/gdalwarp -te 0 0 8192 8192 untiled-resized.jpeg untiled-resized-warped.jpeg
#gdalwarp -te 0 0 8192 8192 untiled-translated.vrt untiled-translated-warped.vrt
mv untiled-translated.vrt untiled-translated-warped.vrt
/home/hutli/gdal-3.1.2/swig/python/scripts/gdal2tiles.py -p raster -s simple -w leaflet --xyz untiled-translated-warped.vrt tiles