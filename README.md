# EmpireMap

This is just a simple static website, to host it simply host the contents of the `www` directory with your favorite web server (like `nginx`).

A docker image may come later `¯\_(ツ)_/¯`

# Building

```sh
git clone https://github.com/hutli/empire-map.git
cd empire-map/www/assets/map
./generate-tiles-bw.sh
./generate-tiles.color.sh
cd ../../..
python regions-descriptions.py
```
