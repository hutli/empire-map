#!/bin/sh
clear
docker-compose down --remove-orphans
docker-compose up --build -d
docker logs -f empire-map_empire-lrp-map_1
