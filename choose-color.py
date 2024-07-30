import json
from pathlib import Path

import colorama
import cv2
import numpy
from colorama import Fore
from loguru import logger


nation_colors_old = {
    "Navarr": "#006838",
    "Dawn": "#be1e2d",
    "Wintermark": "#00adee",
    "The Brass Coast": "#f6921e",
    "Urizen": "#90278e",
    "Highguard": "#cccccc",
    "The League": "#ffff00",
    "Varushka": "#a87c4f",
    "The Marches": "#228B22",
    "Imperial Orcs": "#1ba3bb",
}


def rgb_to_term(rgb):
    return f"\033[48;2;{rgb[0]};{rgb[1]};{rgb[2]}m"


def color_to_vec(color):
    return numpy.asarray(
        [
            int(color[1:3], base=16),
            int(color[3:5], base=16),
            int(color[5:7], base=16),
        ]
    )


def vec_to_color(vec):
    return f"#{vec[0]:02x}{vec[1]:02x}{vec[2]:02x}"


def extract_colors_and_sort(file_name, skip):
    img = cv2.cvtColor(cv2.imread(str(file_name)), cv2.COLOR_BGR2RGB)
    colors = {}
    for x in img:
        for c in x:
            c = tuple(c.tolist())
            if c not in skip:
                if c in colors:
                    colors[c] += 1
                else:
                    colors[c] = 1
    return [k for k, v in sorted(colors.items(), key=lambda x: x[1], reverse=True)]


print("---------- 0: NATION COLORS FROM WIKI IMAGES ----------")
taken_colors = set()
nation_colors_from_wiki_images = {}
for nation_name, old_color in nation_colors_old.items():
    old_color = color_to_vec(old_color)
    nation_dir = Path(f"territory-maps/{nation_name.lower().replace(' ', '-')}")
    nation_color = (0, 0, 0)
    territory_files = list(nation_dir.iterdir())
    for territory_file in territory_files:
        territory_name = (
            territory_file.name.lower()
            .replace("territoriesof", "")
            .replace("territories", "")
        )
        new_territory_file = territory_file.with_name(territory_name)
        territory_file.rename(new_territory_file)
        biggest_color = extract_colors_and_sort(
            new_territory_file, [(0xFF, 0xFF, 0xFF), (0, 0, 0)]
        )[0]
        if biggest_color in taken_colors:
            logger.error(f"{territory_name}: {biggest_color} already taken")
            exit()
        nation_color = (
            nation_color[0] + biggest_color[0],
            nation_color[1] + biggest_color[1],
            nation_color[2] + biggest_color[2],
        )
    nation_color = (
        nation_color[0] // len(territory_files),
        nation_color[1] // len(territory_files),
        nation_color[2] // len(territory_files),
    )

    look_and_feel_color = None

    nation_colors_from_wiki_images[nation_name] = vec_to_color(nation_color)
print(json.dumps(nation_colors_from_wiki_images, indent=4))

print()
print("---------- 1: NATION COLORS FROM WIKI PALETTE ----------")
nation_colors_from_wiki_palette = nation_colors_from_wiki_images.copy()
for nation_name, old_color in nation_colors_from_wiki_images.items():
    old_color = color_to_vec(old_color)
    color = old_color
    if (
        look_and_feel := Path(
            f"look-and-feel-palettes/{nation_name.lower().replace(' ', '-')}.png"
        )
    ).exists():
        colors = numpy.asarray(
            extract_colors_and_sort(look_and_feel, [(0xFF, 0xFF, 0xFF), (0, 0, 0)])
        )
        color = [int(c) for c in numpy.mean(colors, 0)]
    nation_colors_from_wiki_palette[nation_name] = vec_to_color(color)
print(json.dumps(nation_colors_from_wiki_palette, indent=4))

print()
print("---------- 2: NATION COLORS FROM HARD PALETTE ----------")
color_palette = extract_colors_and_sort("palette.png", [(0xFF, 0xFF, 0xFF), (0, 0, 0)])[
    0:10
]
nation_colors_from_wiki_images_copy = nation_colors_from_wiki_images.copy()
nations_colors_from_hard_palette = {}
for p in color_palette:
    closest = (None, 1000)
    for nation_file, c in nation_colors_from_wiki_images_copy.items():
        distance = numpy.linalg.norm(p - color_to_vec(c))
        if distance < closest[1]:
            closest = (nation_file, distance)
    nations_colors_from_hard_palette[closest[0]] = vec_to_color(p)
    nation_colors_from_wiki_images_copy.pop(closest[0])
print(json.dumps(nations_colors_from_hard_palette, indent=4))

print()
print("---------- COLOR PROGRESSION ----------")
print("                         0      1      2")
for nation_name, old_color in nation_colors_old.items():
    print(f"{nation_name}:".ljust(20), end="")
    print(f" -> {rgb_to_term(color_to_vec(old_color))}   \033[0m", end="")
    print(
        f" -> {rgb_to_term(color_to_vec(nation_colors_from_wiki_palette[nation_name]))}   \033[0m",
        end="",
    )
    print(
        f" -> {rgb_to_term(color_to_vec(nation_colors_from_wiki_images[nation_name]))}   \033[0m"
    )
