#!/usr/bin/env python3
"""Generate PWA icons for SeriesTracker – Netflix-style TV + Play design."""

import math
from PIL import Image, ImageDraw

BG = (9, 9, 11)          # #09090b
RED = (229, 57, 53)       # bright red frame
WHITE = (255, 255, 255)


def draw_rounded_rect(draw, x0, y0, x1, y1, radius, fill=None, outline=None, width=1):
    """Draw a filled & outlined rounded rectangle."""
    if fill:
        draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)
    if outline:
        draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, outline=outline, width=width)


def draw_play_triangle(draw, cx, cy, size, color):
    """Draw a right-pointing play triangle centred at (cx, cy)."""
    # Slightly offset centre to the right for optical balance
    offset = size * 0.05
    half_h = size * 0.55
    tip_x = cx + size * 0.45 + offset
    left_x = cx - size * 0.35 + offset
    top_y = cy - half_h
    bot_y = cy + half_h
    draw.polygon([(left_x, top_y), (tip_x, cy), (left_x, bot_y)], fill=color)


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Background rounded square ------------------------------------------
    corner_r = size * 0.16
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_r, fill=BG)

    # For maskable icons, keep content in the central 80 % safe zone
    margin = size * 0.10 if maskable else size * 0.065

    # --- TV outer body (red fill) -------------------------------------------
    tv_x0 = margin
    tv_x1 = size - margin
    tv_y0 = margin + size * 0.05
    tv_y1 = size - margin - size * 0.14   # leave room for stand

    tv_w = tv_x1 - tv_x0
    tv_h = tv_y1 - tv_y0
    tv_corner = tv_h * 0.12

    # TV border thickness
    border = max(4, size * 0.035)

    # Red outer shell
    draw_rounded_rect(draw, tv_x0, tv_y0, tv_x1, tv_y1,
                      radius=tv_corner, fill=RED)

    # Dark screen inset
    screen_x0 = tv_x0 + border
    screen_y0 = tv_y0 + border
    screen_x1 = tv_x1 - border
    screen_y1 = tv_y1 - border
    screen_corner = max(2, tv_corner - border * 0.5)
    draw_rounded_rect(draw, screen_x0, screen_y0, screen_x1, screen_y1,
                      radius=screen_corner, fill=BG)

    # --- TV stand -----------------------------------------------------------
    stand_cx = size / 2
    stand_neck_w = tv_w * 0.10
    stand_neck_h = size * 0.07
    neck_x0 = stand_cx - stand_neck_w / 2
    neck_x1 = stand_cx + stand_neck_w / 2
    neck_y0 = tv_y1
    neck_y1 = tv_y1 + stand_neck_h
    draw.rectangle([neck_x0, neck_y0, neck_x1, neck_y1], fill=RED)

    stand_base_w = tv_w * 0.40
    base_h = size * 0.035
    base_x0 = stand_cx - stand_base_w / 2
    base_x1 = stand_cx + stand_base_w / 2
    base_y0 = neck_y1
    base_y1 = neck_y1 + base_h
    base_corner = base_h * 0.5
    draw_rounded_rect(draw, base_x0, base_y0, base_x1, base_y1,
                      radius=base_corner, fill=RED)

    # --- Play button --------------------------------------------------------
    screen_cx = (screen_x0 + screen_x1) / 2
    screen_cy = (screen_y0 + screen_y1) / 2
    play_size = min(screen_x1 - screen_x0, screen_y1 - screen_y0) * 0.48
    draw_play_triangle(draw, screen_cx, screen_cy, play_size, WHITE)

    return img


def save(img: Image.Image, path: str):
    # Flatten RGBA onto opaque background (PNG supports transparency but
    # some Android launchers render poorly with alpha at the edges)
    bg = Image.new("RGB", img.size, BG)
    bg.paste(img, mask=img.split()[3])
    bg.save(path, "PNG", optimize=True)
    print(f"Saved {path}  ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    save(make_icon(192), "public/icon-192.png")
    save(make_icon(512), "public/icon-512.png")
    save(make_icon(512, maskable=True), "public/icon-maskable-512.png")
    print("Done.")
