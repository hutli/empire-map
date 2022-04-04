# Empire LARP Map

Empire LARP Map is just a static website. You can host the `www` directory contents with your favourite web server (like `nginx`). The website will work but will not contain the correct fonts; please refer to building [Fonts](#Fonts).

Hosting the website "as-is" will result in you using https://empirelarpmap.com/ as tiling and GeoJSON data server. To host these files yourself, you have to build them and change the constants `TILE_SERVER_BASE_URL` and `GEOJSON_DATA_BASE_URL` in `main.js` accordingly.

# Building

## Docker

The easiest way to build everything is through docker.

```bash
docker-compose up --build
```

This will expose a completely self-hosted the website on port `1457`.

⚠️ WARNING: Building does take several hours! ⚠️

## Build it Yourself

The following steps assume that `python` refers to a Python 3 binary and that `pip` refers to a Pip 3 binary. If this is not the case, you are probably using Ubuntu/Debian, and I recommend installing `python-is-python3`.

## Fonts

The one thing you will most likely want to build if hosting outside of docker are the fonts used. The fonts are nothing special; they are really just fonts from https://fonts.googleapis.com/, but since Empire LARP Map is Cookie-Free Safe-Space™, we cannot include them directly. This is because CSS files from https://fonts.googleapis.com request https://fonts.gstatic.com for the actual font files, which, as you can imagine, is far from cookie-free.

![meme](/meme.png?raw=true "meme")

To build/download the fonts:

```bash
pip install -r requirements.txt
python utilities.py degoogle-css -c www/css/fonts.css -d www/fonts -r fonts -u "https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
```

## GeoJSON

The GeoJSON files included in the `data`-dir have not yet been populated with the Empire LARP Wiki data. I could probably, at this point, include GeoJSON files already populated in this repo without any problem. However, to not eventually end up with a _giant_ JSON file containing the entire Empire Wiki they include just enough data to be automatically populated from Empire LARP Wiki. Furthermore, since the Empire LARP Wiki is constantly updated, it is always a good idea to regularly repopulate these files anyway. To do so:

```bash
pip install -r requirements.txt
python utilities.py populate-json -i data/nations.json -o www/assets/map/nations.json
python utilities.py populate-json -i data/regions.json -o www/assets/map/regions.json
python utilities.py populate-json -i data/poi.json -o www/assets/map/poi.json
```

Remember to change the constant `GEOJSON_DATA_BASE_URL` in `main.js`!

## Tiles

Building the tiles for the tiling server is undoubtedly the most time-consuming part of the building process.

⚠️ It takes several hours and will use several GB of harddisk space ⚠️

You first need to install GDAL on your computer. On Ubuntu, this is done so:

```bash
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ubuntugis/ppa
sudo apt update -y
sudo apt install gdal-bin libgdal-dev -y
```

You can now build the tiles. The following script assumes that `wget` is installed as it, unfortunately, has to download the raw image files from https://empirelarpmap.com. They are too large for me to include in this GitHub repo with my free account.

```bash
./build-tiles.sh
```

Lastly, change the constant `TILE_SERVER_BASE_URL` in `main.js`!
