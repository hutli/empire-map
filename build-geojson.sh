#!/bin/sh
python utilities.py generate-nations-json -t data/territories.json -n data/nations.json
python utilities.py populate-json -i data/nations.json -o www/assets/map/nations.json
python utilities.py populate-json -i data/territories.json -o www/assets/map/territories.json
python utilities.py populate-json -i data/poi.json -o www/assets/map/poi.json -n data/nations.json