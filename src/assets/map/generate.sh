gdal_translate -of JPEG -outsize 8192 8192 untiled.png untiled-resized.jpg
python3 gdal2tiles.py -p raster -w leaflet untiled-resized.jpg empire-map