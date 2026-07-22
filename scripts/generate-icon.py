#!/usr/bin/env python3
"""Generate app icon for HQ Elektrotechnik app."""
from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 1024
CORNER_RADIUS = 224  # iOS icon corner radius at 1024

def rounded_rectangle(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)

img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Background - deep blue gradient effect (solid for simplicity)
bg_color = (55, 90, 180)  # Professional blue
rounded_rectangle(draw, [0, 0, SIZE, SIZE], CORNER_RADIUS, bg_color)

# Add subtle darker bottom
for y in range(SIZE // 2, SIZE):
    alpha = int((y - SIZE // 2) / (SIZE // 2) * 40)
    for x in range(SIZE):
        px = img.getpixel((x, y))
        if px[3] > 0:
            img.putpixel((x, y), (max(0, px[0] - alpha), max(0, px[1] - alpha), max(0, px[2] - alpha), px[3]))

draw = ImageDraw.Draw(img)

# "BQ" text - large, bold, white
try:
    font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 420)
    font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 120)
except:
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/SFCompact.ttf", 420)
        font_small = ImageFont.truetype("/System/Library/Fonts/SFCompact.ttf", 120)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

# Draw "HQ" centered
text = "HQ"
bbox = draw.textbbox((0, 0), text, font=font_large)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (SIZE - tw) // 2
y = (SIZE - th) // 2 - 60

# White text with slight shadow
draw.text((x + 4, y + 4), text, fill=(0, 0, 0, 60), font=font_large)
draw.text((x, y), text, fill=(255, 255, 255, 255), font=font_large)

# Small line below
line_y = y + th + 30
line_w = 200
draw.rectangle(
    [(SIZE - line_w) // 2, line_y, (SIZE + line_w) // 2, line_y + 8],
    fill=(255, 210, 0, 200)  # Gold accent
)

# "PRÜFUNG" below
sub_text = "PRÜFUNG"
bbox2 = draw.textbbox((0, 0), sub_text, font=font_small)
tw2 = bbox2[2] - bbox2[0]
draw.text(((SIZE - tw2) // 2, line_y + 30), sub_text, fill=(255, 255, 255, 180), font=font_small)

# Save
assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets')
img.save(os.path.join(assets_dir, 'icon.png'))

# Also create adaptive icon (foreground only, with padding)
adaptive = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
adaptive_draw = ImageDraw.Draw(adaptive)
# Paste content with padding for adaptive icon
padding = 150
content_area = img.crop((padding, padding, SIZE - padding, SIZE - padding))
content_resized = content_area.resize((SIZE, SIZE), Image.LANCZOS)
adaptive = Image.new('RGBA', (SIZE, SIZE), bg_color + (255,))
adaptive_draw = ImageDraw.Draw(adaptive)
adaptive_draw.text((x, y), text, fill=(255, 255, 255, 255), font=font_large)
adaptive_draw.rectangle([(SIZE - line_w) // 2, line_y, (SIZE + line_w) // 2, line_y + 8], fill=(255, 210, 0, 200))
adaptive_draw.text(((SIZE - tw2) // 2, line_y + 30), sub_text, fill=(255, 255, 255, 180), font=font_small)
adaptive.save(os.path.join(assets_dir, 'adaptive-icon.png'))

# Splash icon (same but smaller on white bg)
splash = Image.new('RGBA', (SIZE, SIZE), (255, 255, 255, 255))
icon_small = img.resize((400, 400), Image.LANCZOS)
splash.paste(icon_small, ((SIZE - 400) // 2, (SIZE - 400) // 2), icon_small)
splash.save(os.path.join(assets_dir, 'splash-icon.png'))

print(f"Icons generated in {assets_dir}")
print(f"  icon.png: {os.path.getsize(os.path.join(assets_dir, 'icon.png'))} bytes")
print(f"  adaptive-icon.png: {os.path.getsize(os.path.join(assets_dir, 'adaptive-icon.png'))} bytes")
print(f"  splash-icon.png: {os.path.getsize(os.path.join(assets_dir, 'splash-icon.png'))} bytes")
