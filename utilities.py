import json
import re
from dataclasses import asdict, dataclass

import click
import click_pathlib
import httpx
import networkx as nx
import numpy as np
from centerline.geometry import Centerline
from shapely import geometry, ops
from shapely.geometry import LineString, MultiPoint, Polygon
from tqdm import tqdm


def extract_body(page, header_id, include_header=False, hlevel=None):
    id_tag = f'id="{header_id}"'
    before_id, after_id = page.split(id_tag, 1)
    if not hlevel:
        hlevel = "h" + before_id.rsplit("<h", 1)[1].split(" ", 1)[0].split(">", 1)[0]

    hsplit = f"<{hlevel}"
    if not include_header:
        body = after_id.split("</h", 1)[-1].split(">", 1)[-1]
        return body.split(hsplit, 1)[0]
    else:
        body = "<h" + before_id.rsplit("<h", 1)[-1] + id_tag + after_id
        return hsplit.join(body.split(hsplit, 2)[:2])


def find_nation(x, y, nations):
    for nation_name, nation_geometry in nations:
        for nation_polygon in nation_geometry:
            if geometry.Point(x, y).within(geometry.Polygon(nation_polygon)):
                return nation_name
    return "Non-imperial"


def table_from_url(url):
    r = httpx.get(url).text

    table = r.split("<table", 1)[1].split(">", 1)[1].split("</table>", 1)[0].strip()
    table = [
        [
            re.sub(r"<[^>]*>", "", tt)
            for tt in re.split(r"<t.?>", t.split("</tr>", 1)[0])[1:]
        ]
        for t in table.split("<tr>")[1:]
    ]
    keys = [k.lower().replace(" ", "_") for k in table[0]]
    table = [t for t in table[1:] if t]
    return [{keys[i]: v for i, v in enumerate(t)} for t in table]


@click.group()
def cli():
    pass


@cli.command()
@click.option(
    "--input-json",
    "-i",
    required=True,
    type=click_pathlib.Path(exists=True, dir_okay=False, resolve_path=True),
    help="Raw JSON file to populate",
)
@click.option(
    "--output-json",
    "-o",
    required=True,
    type=click_pathlib.Path(dir_okay=False, resolve_path=True),
    help="Path to save populated JSON to",
)
@click.option(
    "--nation-json",
    "-n",
    default=None,
    type=click_pathlib.Path(dir_okay=False, resolve_path=True),
    help="JSON containing GeoJSON of nations (to populate location nations)",
)
def populate_json(input_json, output_json, nation_json):
    with open(input_json) as f:
        data = json.loads(f.read())

    nations = None
    if nation_json:
        with open(nation_json) as f:
            nations = [
                (f["properties"]["nation"], f["geometry"]["coordinates"])
                for f in json.loads(f.read())["features"]
            ]

    for i, feature in tqdm(
        list(enumerate(data["features"])), desc=f'Populating "{input_json.stem}"'
    ):
        url = feature["properties"]["url"]
        page = httpx.get(url, verify=False).text

        if "name" not in feature["properties"]:
            data["features"][i]["properties"]["name"] = (
                url.rsplit("/", 1)[-1].rsplit("#", 1)[-1].replace("_", " ")
            )

        if (
            nations
            and feature["geometry"]["type"] == "Point"
            and "nation" not in feature["properties"]
        ):
            x, y = feature["geometry"]["coordinates"]
            data["features"][i]["properties"]["nation"] = find_nation(x, y, nations)

        description_id = None
        if "description-id" in feature["properties"]:
            description_id = feature["properties"]["description-id"]
        elif "#" in url:
            description_id = url.split("#", 1)[1]

        if description_id:
            data["features"][i]["properties"]["description-id"] = description_id
            description = extract_body(page, description_id)
        elif f'id="Overview"' in page:
            description = extract_body(page, "Overview")
        elif f'id="mw-content-text"' in page:
            description = (
                page.split(f'id="mw-content-text"', 1)[1]
                .split(">", 1)[1]
                .split(f"<h2", 1)[0]
            )
        else:
            raise Exception(f'{feature["properties"]["url"]}')

        if "extra-urls" in feature["properties"]:
            for extra_url in feature["properties"]["extra-urls"]:
                extra_page = httpx.get(extra_url, verify=False).text
                extra_id = extra_url.rsplit("/", 1)[-1].rsplit("#", 1)[-1]
                description += extract_body(extra_page, extra_id, include_header=True)

        if 'id="The_Resource"' in page:
            description += extract_body(page, "The_Resource", include_header=True)

        description = (
            description.strip()
            .replace("\n", "")
            .replace('href="#', f'href="/{url.split("/", 3)[-1]}#')
            .replace('href="', 'href="https://www.profounddecisions.co.uk')
            .replace('src="', 'src="https://www.profounddecisions.co.uk')
            .replace("<a ", '<a target="_blank"')
        )
        data["features"][i]["properties"]["description"] = description

    with open(output_json, "w") as f:
        f.write(json.dumps(data))


@cli.command()
@click.option(
    "--territories-json",
    "-t",
    required=True,
    type=click_pathlib.Path(exists=True, dir_okay=False, resolve_path=True),
    help="JSON containing territories to build nations from",
)
@click.option(
    "--nations-json",
    "-n",
    required=True,
    type=click_pathlib.Path(dir_okay=False, resolve_path=True),
    help="Path to save nations JSON file on",
)
def generate_nations_json(territories_json, nations_json):

    # Extract and group all features by their nation
    nation_features = {}
    with open(territories_json) as f:
        for territory in json.loads(f.read())["features"]:
            nation = territory["properties"]["nation"]
            if "lost" not in nation.lower() and "non-imperial" not in nation.lower():
                if nation not in nation_features:
                    nation_features[nation] = {
                        "type": "Feature",
                        "properties": {
                            "url": f"https://www.profounddecisions.co.uk/empire-wiki/{nation.replace(' ', '_')}",
                            "nation": nation,
                        },
                        "geometry": {"type": "Polygon", "coordinates": []},
                    }
                nation_features[nation]["geometry"]["coordinates"].extend(
                    territory["geometry"]["coordinates"]
                )

    # Union all touching territories of the same nation
    # This is done so the nation border does not "go through" the nation
    to_union = {}
    for nation, feature in tqdm(
        nation_features.items(), desc="Creating nations from territories"
    ):
        geometries_touching = True
        while geometries_touching:
            geometries_touching = False
            for i, coordinates in enumerate(feature["geometry"]["coordinates"]):
                for c in coordinates:
                    match = next(
                        (
                            oc
                            for oc in feature["geometry"]["coordinates"]
                            if coordinates != oc and c in oc
                        ),
                        None,
                    )
                    if match:
                        feature["geometry"]["coordinates"][i] = [
                            list(c)
                            for c in ops.unary_union(
                                [
                                    geometry.Polygon(coordinates),
                                    geometry.Polygon(match),
                                ]
                            ).exterior.coords
                        ]
                        feature["geometry"]["coordinates"].remove(match)
                        geometries_touching = True
                        break

    final_json = {
        "type": "FeatureCollection",
        "features": list(nation_features.values()),
    }
    with open(nations_json, "w") as f:
        f.write(json.dumps(final_json))


def get_css_property(source, name, end=";"):
    return source.split(name, 1)[1].split(end, 1)[0].replace('"', "").replace("'", "")


@cli.command()
@click.option(
    "--url",
    "-u",
    required=True,
    type=str,
    help="URL generated by https://fonts.google.com",
)
@click.option(
    "--fonts-css",
    "-c",
    required=True,
    type=click_pathlib.Path(dir_okay=False, resolve_path=True),
    help="Path to css file to overwrite/create",
)
@click.option(
    "--fonts-dir",
    "-d",
    required=True,
    type=click_pathlib.Path(exists=True, file_okay=False, resolve_path=True),
    help="Directory to place fonts",
)
@click.option(
    "--fonts-root-url",
    "-r",
    required=True,
    type=str,
    help="Root URL for fonts (often at least partially the fonts dir path)",
)
def degoogle_css(url, fonts_dir, fonts_css, fonts_root_url):
    headers = {}
    headers["authority"] = "fonts.googleapis.com"
    headers["cache-control"] = "max-age=0"
    headers["upgrade-insecure-requests"] = "1"
    headers[
        "user-agent"
    ] = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.15.3 Chrome/87.0.4280.144 Safari/537.36"
    headers[
        "accept"
    ] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
    headers["accept-language"] = "en-US,en;q=0.9"
    headers["dnt"] = "1"
    headers["sec-fetch-site"] = "none"
    headers["sec-fetch-mode"] = "navigate"
    headers["sec-fetch-user"] = "?1"
    headers["sec-fetch-dest"] = "document"
    headers["if-modified-since"] = "Sat, 02 Apr 2022 09:14:29 GMT"

    fonts = httpx.get(url, headers=headers).text
    family_counter = {}
    for font in tqdm(list(fonts.split("@font-face {")[1:])):
        family = get_css_property(font, "font-family: ")
        style = get_css_property(font, "font-style: ")
        weight = get_css_property(font, "font-weight: ")
        display = get_css_property(font, "font-display: ")
        url = get_css_property(font, "src: url(", end=")")
        if family not in family_counter:
            family_counter[family] = 0
        else:
            family_counter[family] += 1

        font_file_name = f"{family}_{family_counter[family]}.woff2"
        new_url = f"/{fonts_root_url}/{font_file_name}"
        fonts = fonts.replace(url, new_url)
        with open(fonts_dir / font_file_name, "wb") as o:
            o.write(httpx.get(url).content)
    with open(fonts_css, "w") as f:
        f.write(fonts)


def find_longest_linestring(mls):
    graph = nx.Graph()
    for m in mls.geoms:
        [x, y] = list(m.coords)
        graph.add_edge(x, y, weight=m.length)
        graph.add_edge(y, x, weight=m.length)
    ends = [x for x in graph.nodes() if graph.degree(x) <= 1]

    longest_path = (0, None, None)
    for e0 in ends:
        for e1 in ends:
            length = nx.shortest_path_length(graph, source=e0, target=e1)
            if length > longest_path[0]:
                longest_path = (length, e0, e1)

    path = nx.shortest_path(graph, longest_path[1], longest_path[2])
    return LineString(path)


@dataclass
class Army:
    army: str
    nation: str
    quality: str
    current_location: str
    election: str
    general: str


@cli.command()
@click.option(
    "--url",
    "-u",
    required=True,
    type=str,
    help="URL of page containing armies table",
)
@click.option(
    "--territories-json",
    "-t",
    required=True,
    type=click_pathlib.Path(exists=True, dir_okay=False, resolve_path=True),
    help="JSON containing territories to build nations from",
)
@click.option(
    "--armies-json",
    "-a",
    required=True,
    type=click_pathlib.Path(dir_okay=False, resolve_path=True),
    help="Path to save armies JSON file on",
)
def generate_armies_json(url, territories_json, armies_json):
    with open(territories_json) as f:
        territories = json.loads(f.read())["features"]

    armies = [Army(**t) for t in table_from_url(url)]

    geojson = {"type": "FeatureCollection", "features": []}
    for t in tqdm(territories, desc=f'Generating "armies"'):
        armies_in_territory = [
            a
            for a in armies
            if a.current_location.lower() == t["properties"]["name"].lower()
        ]
        if armies_in_territory:
            coordinates = [tuple(c) for c in t["geometry"]["coordinates"][0]]
            polygon = Polygon(coordinates)
            attributes = {"id": 1, "name": "polygon", "valid": True}
            centerline = Centerline(polygon, **attributes)
            longest_centerline = find_longest_linestring(centerline)
            segments = len(armies_in_territory) + 2
            segment_length = longest_centerline.length / (segments - 1)
            points = MultiPoint(
                [
                    longest_centerline.interpolate(i * segment_length)
                    for i in range(segments)
                ]
            )
            # with open("polygon.svg", "w") as f:
            #     f.write(polygon._repr_svg_())
            # with open("centerline.svg", "w") as f:
            #     f.write(centerline._repr_svg_())
            # with open("longest_centerline.svg", "w") as f:
            #     f.write(longest_centerline._repr_svg_())
            # with open("points.svg", "w") as f:
            #     f.write(points._repr_svg_())
            # break
            for i, army in enumerate(armies_in_territory):
                geojson["features"].append(
                    {
                        "type": "Feature",
                        "properties": {
                            **asdict(army),
                            "icon": f'images/armies/{army.army.lower().replace(" ", "-")}.png',
                            "url": f'https://www.profounddecisions.co.uk/empire-wiki/{army.army.replace(" ", "_")}',
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [
                                round(p, 2) for p in (points.geoms[i + 1].coords)[0]
                            ],
                        },
                    }
                )
    with open(armies_json, "w") as f:
        f.write(json.dumps(geojson))


if __name__ == "__main__":
    cli()
