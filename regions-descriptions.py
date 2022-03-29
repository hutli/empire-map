import json

import requests
from bs4 import BeautifulSoup


def update_descriptions(file_name):
    with open(f"pure/assets/map/{file_name}.json") as f:
        data = json.loads(f.read())

    for i, region in enumerate(data["features"]):
        url = region["properties"]["url"]
        page = requests.get(url, verify=False).text

        if (
            "description-id" in region["properties"]
            and f'id="{region["properties"]["description-id"]}"' in page
        ):
            description = page.split(
                f'id="{region["properties"]["description-id"]}"', 1
            )[1]
        elif f'id="Overview"' in page:
            description = page.split(f'id="Overview"', 1)[1]
        else:
            raise (f'{region["properties"]["url"]}')

        hlevel = (
            region["properties"]["hlevel"] if "hlevel" in region["properties"] else 2
        )
        description = description.split(f"</h{hlevel}>", 1)[1]
        for j in range(1, hlevel):
            description = description.split(f"<h{j}>", 1)[0]

        description = (
            description.strip()
            .replace("\n", "")
            .replace('href="#', f'href="/{url.split("/", 3)[-1]}#')
            .replace('href="', 'href="https://www.profounddecisions.co.uk')
            .replace('src="', 'src="https://www.profounddecisions.co.uk')
            .replace("<a ", '<a target="_blank"')
        )
        data["features"][i]["properties"]["description"] = description

    with open(f"pure/assets/map/{file_name}.json", "w") as f:
        f.write(json.dumps(data, indent=4))


update_descriptions("regions")
update_descriptions("poi")
