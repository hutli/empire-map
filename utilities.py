import json
import re

import requests
from bs4 import BeautifulSoup
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from tqdm import tqdm

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)


def update_descriptions(file_name):
    with open(f"www/assets/map/{file_name}.json") as f:
        data = json.loads(f.read())

    for i, feature in tqdm(
        list(enumerate(data["features"])), desc=f'Processing "{file_name}"'
    ):
        url = feature["properties"]["url"]
        page = requests.get(url, verify=False).text
        data["features"][i]["properties"]["name"] = (
            url.rsplit("/", 1)[-1].rsplit("#", 1)[-1].replace("_", " ")
        )

        if "#" in url:
            description_id = url.split("#", 1)[1]
            data["features"][i]["properties"]["description-id"] = description_id
            hlevel, description = page.split(f'id="{description_id}"', 1)
            hlevel = hlevel.rsplit("<", 1)[1].split(" ", 1)[0]
            description = description.split(f"</{hlevel}>", 1)[1]
        elif f'id="Overview"' in page:
            hlevel, description = page.split(f'id="Overview"', 1)
            hlevel = hlevel.rsplit("<", 1)[1].split(" ", 1)[0]
            description = description.split(f"</{hlevel}>", 1)[1]
        elif f'id="mw-content-text"' in page:
            description = page.split(f'id="mw-content-text"', 1)[1].split(">", 1)[1]
            hlevel = "h2"
        else:
            raise Exception(f'{feature["properties"]["url"]}')

        description = description.split(f"<{hlevel}", 1)[0]
        description = (
            description.strip()
            .replace("\n", "")
            .replace('href="#', f'href="/{url.split("/", 3)[-1]}#')
            .replace('href="', 'href="https://www.profounddecisions.co.uk')
            .replace('src="', 'src="https://www.profounddecisions.co.uk')
            .replace("<a ", '<a target="_blank"')
        )
        data["features"][i]["properties"]["description"] = description

    with open(f"www/assets/map/{file_name}.json", "w") as f:
        f.write(json.dumps(data, indent=4))


update_descriptions("nations")
update_descriptions("regions")
update_descriptions("poi")
