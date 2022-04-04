#!/bin/sh
python utilities.py populate-json -i data/nations.json -o www/assets/map/nations.json
python utilities.py populate-json -i data/regions.json -o www/assets/map/regions.json
python utilities.py populate-json -i data/poi.json -o www/assets/map/poi.json