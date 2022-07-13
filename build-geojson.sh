#!/bin/sh
python utilities.py generate-nations-json -t data/territories.json -n data/nations.json
python utilities.py populate-json -i data/nations.json -o www/assets/map/nations.json
python utilities.py populate-json -i data/territories.json -o www/assets/map/territories.json
python utilities.py populate-json -i data/poi.json -o www/assets/map/poi.json -n data/nations.json
python utilities.py generate-armies-json -u https://www.profounddecisions.co.uk/empire-wiki/Imperial_army -t www/assets/map/territories.json -a data/armies.json
python utilities.py populate-json -i data/armies.json -o www/assets/map/armies.json