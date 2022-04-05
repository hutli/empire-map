FROM ubuntu:20.04 AS app
WORKDIR /app/

# MAKE NEEDED DIRS
RUN mkdir www/
RUN mkdir www/fonts/
RUN mkdir www/css/
RUN mkdir www/assets/
RUN mkdir www/assets/map/

# INSTALL GDAL
RUN apt-get update -y
RUN apt-get install software-properties-common apt-utils -y
RUN add-apt-repository ppa:ubuntugis/ppa
RUN apt-get update -y
RUN apt-get install gdal-bin libgdal-dev git wget python3 python3-pip python-is-python3 -y

#     BUILD MAP TILES
# ⚠️ TAKES A LONG TIME ⚠️
COPY build-tiles.sh /app/
RUN ./build-tiles.sh

# SETUP UTILITIES SCRIPT
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY utilities.py /app/

# BUILD GEOJSON
COPY data/ /app/data/
COPY build-geojson.sh /app/
RUN ./build-geojson.sh

# BUILD FONTS
COPY build-fonts.sh /app/
RUN ./build-fonts.sh

# SERVE STATIC WEBSITE
FROM nginx:latest
WORKDIR /www/

COPY --from=app /app/www/ /www/
COPY www/ /www/
COPY mime.types /etc/nginx/
COPY nginx.conf /etc/nginx/