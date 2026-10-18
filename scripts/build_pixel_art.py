"""
build_pixel_art.py
Generates authentic 16-bit pixel art assets for Bleuming:
- assets/map_base.png (640x480 peaceful garden with natural paths, trees, pond, cottage, mirror grove)
- assets/map_blooming.png (640x480 fully bloomed garden with radiant roses, sparkling mirror, sunny glade)
- assets/player_sprites.png (4-directional walk & idle cycles)
- assets/nihi_sprites.png (5 animated states: idle, happy, concerned, thoughtful, cheering)
- assets/npc_sprites.png (Saffron and Maya in-world pixel sprites)
"""

import math
import random
from PIL import Image, ImageDraw

# Enforce Palette
PALETTE = {
    'cream': (255, 244, 223),      # #FFF4DF
    'cream_dark': (229, 210, 186), # Path stones
    'sage': (155, 190, 145),       # #9BBE91
    'sage_light': (182, 214, 173), # Grass highlights
    'sage_dark': (116, 155, 108),  # Grass shadows
    'forest': (65, 105, 78),       # #41694E
    'forest_dark': (45, 75, 55),   # Tree shadows
    'blush': (243, 167, 198),      # #F3A7C6
    'berry': (217, 93, 145),       # #D95D91
    'lavender': (183, 167, 232),   # #B7A7E8
    'lavender_dark': (142, 122, 196),
    'blue': (169, 214, 239),       # #A9D6EF
    'blue_deep': (90, 150, 195),   # Pond water
    'blue_dark': (55, 105, 145),   # Deep pond
    'outline': (73, 48, 68),       # #493044
    'gold': (233, 200, 120),       # #E9C878
    'gold_light': (255, 230, 165),
    'wood': (130, 85, 60),
    'wood_dark': (85, 55, 40),
    'skin': (255, 220, 190),
    'hair_brown': (110, 65, 45)
}

TILE_SIZE = 32
WIDTH = 640
HEIGHT = 480
COLS = 20
ROWS = 15

random.seed(42)

def create_pixel_tree(draw, cx, cy, size=1.0):
    """Draw a lush, layered oak-style pixel tree with deep shadows and organic foliage."""
    r_trunk = int(7 * size)
    h_trunk = int(22 * size)
    
    # Ground shadow
    draw.ellipse([cx - int(24*size), cy + h_trunk - int(6*size), 
                  cx + int(24*size), cy + h_trunk + int(8*size)], 
                 fill=(40, 60, 45, 100))
    
    # Trunk
    draw.rectangle([cx - r_trunk, cy, cx + r_trunk, cy + h_trunk], fill=PALETTE['wood_dark'])
    draw.rectangle([cx - r_trunk + 2, cy, cx + r_trunk - 2, cy + h_trunk - 2], fill=PALETTE['wood'])
    # Roots
    draw.polygon([(cx - r_trunk, cy + h_trunk - 4), (cx - r_trunk - 6, cy + h_trunk + 3), (cx - r_trunk + 2, cy + h_trunk)], fill=PALETTE['wood_dark'])
    draw.polygon([(cx + r_trunk, cy + h_trunk - 4), (cx + r_trunk + 6, cy + h_trunk + 3), (cx + r_trunk - 2, cy + h_trunk)], fill=PALETTE['wood_dark'])
    
    # Layered foliage clusters
    clusters = [
        (-int(12*size), -int(6*size), int(22*size)),
        (int(12*size), -int(6*size), int(22*size)),
        (0, -int(18*size), int(26*size)),
        (-int(14*size), -int(16*size), int(18*size)),
        (int(14*size), -int(16*size), int(18*size)),
        (0, -int(24*size), int(20*size))
    ]
    
    # 1. Dark background silhouette / outline
    for ox, oy, rad in clusters:
        draw.ellipse([cx + ox - rad - 2, cy + oy - rad - 2, cx + ox + rad + 2, cy + oy + rad + 2], fill=PALETTE['outline'])
    # 2. Deep forest green body
    for ox, oy, rad in clusters:
        draw.ellipse([cx + ox - rad, cy + oy - rad, cx + ox + rad, cy + oy + rad], fill=PALETTE['forest_dark'])
    # 3. Midtone foliage
    for ox, oy, rad in clusters:
        draw.ellipse([cx + ox - rad + 3, cy + oy - rad + 2, cx + ox + rad - 2, cy + oy + rad - 4], fill=PALETTE['forest'])
    # 4. Soft sage highlights on top
    for ox, oy, rad in clusters:
        draw.ellipse([cx + ox - int(rad*0.6), cy + oy - rad + 4, cx + ox + int(rad*0.6), cy + oy - int(rad*0.2)], fill=PALETTE['sage'])
        # A tiny cream highlight touch
        draw.ellipse([cx + ox - 4, cy + oy - rad + 6, cx + ox + 4, cy + oy - rad + 11], fill=PALETTE['sage_light'])

def create_pixel_bush(draw, cx, cy, rad=12, flower_color=None):
    """Draw a rounded garden shrub with optional flowers."""
    draw.ellipse([cx - rad - 1, cy - rad + 2, cx + rad + 1, cy + rad + 4], fill=PALETTE['outline'])
    draw.ellipse([cx - rad, cy - rad + 1, cx + rad, cy + rad + 2], fill=PALETTE['forest'])
    draw.ellipse([cx - rad + 2, cy - rad + 2, cx + rad - 2, cy + rad - 2], fill=PALETTE['sage'])
    draw.ellipse([cx - rad//2, cy - rad + 3, cx + rad//2, cy - rad//2 + 2], fill=PALETTE['sage_light'])
    
    if flower_color:
        for fx, fy in [(-5, -3), (4, -4), (-2, 4), (6, 3)]:
            draw.ellipse([cx + fx - 2, cy + fy - 2, cx + fx + 2, cy + fy + 2], fill=flower_color)
            draw.point([cx + fx, cy + fy], fill=PALETTE['cream'])

def generate_map(blooming=False):
    """Generate the full 640x480 pixel art garden map."""
    img = Image.new('RGB', (WIDTH, HEIGHT), PALETTE['sage'])
    draw = ImageDraw.Draw(img)

    # 1. Base grass with organic texture variation
    for y in range(0, HEIGHT, 4):
        for x in range(0, WIDTH, 4):
            val = (math.sin(x * 0.05) + math.cos(y * 0.06) + random.uniform(-0.4, 0.4))
            if val > 0.8:
                draw.point([x, y], fill=PALETTE['sage_light'])
            elif val < -0.8:
                draw.point([x, y], fill=PALETTE['sage_dark'])

    # Clover and wild grass blades
    for _ in range(350):
        gx = random.randint(10, WIDTH - 10)
        gy = random.randint(10, HEIGHT - 10)
        draw.line([gx, gy, gx - 1, gy - 3], fill=PALETTE['sage_light'])
        draw.line([gx, gy, gx + 2, gy - 2], fill=PALETTE['forest'])

    # Wildflowers in grass
    wildflower_colors = [PALETTE['blush'], PALETTE['cream'], PALETTE['gold'], PALETTE['lavender']]
    for _ in range(120):
        wx = random.randint(15, WIDTH - 15)
        wy = random.randint(15, HEIGHT - 15)
        c = random.choice(wildflower_colors)
        draw.ellipse([wx - 1, wy - 1, wx + 1, wy + 1], fill=c)
        draw.point([wx, wy], fill=PALETTE['outline'])

    # 2. Seamless cobblestone paths
    # Defined path corridors:
    # A) Main central avenue: from (6, 14) up to (10, 8), connecting to fountain & bench
    # B) Northwest branch: up-left towards the Mirror Grove (3, 3)
    # C) Northeast branch: up-right towards the Cottage Porch (14, 3)
    # D) East branch: towards the Forest path (18, 9)
    path_points = []
    # Vertical main spine
    for y in range(240, 460, 16):
        path_points.append((256, y, 28))
        path_points.append((288, y, 28))
    # Plaza around fountain
    for a in range(0, 360, 20):
        rad = math.radians(a)
        path_points.append((300 + math.cos(rad) * 45, 230 + math.sin(rad) * 45, 22))
    # Branch to Mirror (northwest)
    for t in range(10):
        px = 250 - t * 16
        py = 220 - t * 12
        path_points.append((px, py, 26))
    # Branch to Cottage (northeast)
    for t in range(12):
        px = 320 + t * 14
        py = 210 - t * 12
        path_points.append((px, py, 26))
    # Branch to Forest (east)
    for t in range(12):
        px = 330 + t * 24
        py = 270 + math.sin(t * 0.5) * 15
        path_points.append((px, py, 26))

    # Draw path underlay
    for px, py, r in path_points:
        draw.ellipse([px - r - 2, py - r - 2, px + r + 2, py + r + 2], fill=PALETTE['outline'])
    for px, py, r in path_points:
        draw.ellipse([px - r, py - r, px + r, py + r], fill=PALETTE['cream_dark'])
    for px, py, r in path_points:
        draw.ellipse([px - r + 3, py - r + 3, px + r - 3, py + r - 3], fill=PALETTE['cream'])

    # Cobblestone pattern overlay inside path
    for _ in range(600):
        px = random.randint(20, WIDTH - 20)
        py = random.randint(20, HEIGHT - 20)
        # Check if inside any path circle
        in_path = False
        for ppx, ppy, pr in path_points:
            if math.hypot(px - ppx, py - ppy) < pr - 2:
                in_path = True
                break
        if in_path:
            sw = random.randint(4, 9)
            sh = random.randint(3, 6)
            draw.ellipse([px - sw//2, py - sh//2, px + sw//2, py + sh//2], fill=PALETTE['cream_dark'], outline=PALETTE['outline'])
            draw.ellipse([px - sw//2 + 1, py - sh//2 + 1, px + sw//2 - 1, py + sh//2 - 1], fill=PALETTE['cream'])

    # 3. Organic Shimmering Pond (South-Central: x=140 to 220, y=310 to 390)
    pond_cx, pond_cy = 180, 350
    # Pond shoreline
    draw.ellipse([pond_cx - 56, pond_cy - 44, pond_cx + 56, pond_cy + 44], fill=PALETTE['outline'])
    draw.ellipse([pond_cx - 52, pond_cy - 40, pond_cx + 52, pond_cy + 40], fill=PALETTE['sage_dark'])
    # Shore pebbles
    for a in range(0, 360, 30):
        rad = math.radians(a)
        bx = pond_cx + math.cos(rad) * 51
        by = pond_cy + math.sin(rad) * 39
        draw.ellipse([bx - 4, by - 3, bx + 4, by + 3], fill=PALETTE['cream_dark'], outline=PALETTE['outline'])
    # Water surface
    draw.ellipse([pond_cx - 48, pond_cy - 36, pond_cx + 48, pond_cy + 36], fill=PALETTE['blue_dark'])
    draw.ellipse([pond_cx - 44, pond_cy - 32, pond_cx + 44, pond_cy + 32], fill=PALETTE['blue_deep'])
    draw.ellipse([pond_cx - 36, pond_cy - 24, pond_cx + 36, pond_cy + 24], fill=PALETTE['blue'])
    # Water ripple highlights
    draw.line([pond_cx - 25, pond_cy - 12, pond_cx - 5, pond_cy - 12], fill=PALETTE['cream'], width=2)
    draw.line([pond_cx + 10, pond_cy + 8, pond_cx + 30, pond_cy + 8], fill=PALETTE['cream'], width=2)
    draw.line([pond_cx - 15, pond_cy + 18, pond_cx + 8, pond_cy + 18], fill=PALETTE['blue'], width=2)
    # Lily pads & Lotus
    for lx, ly in [(-20, -6), (18, -14), (5, 12)]:
        px = pond_cx + lx
        py = pond_cy + ly
        draw.ellipse([px - 6, py - 4, px + 6, py + 4], fill=PALETTE['forest'])
        draw.polygon([(px, py), (px + 4, py - 4), (px + 6, py)], fill=PALETTE['blue'])
        # Lotus flower
        draw.ellipse([px - 2, py - 5, px + 2, py - 1], fill=PALETTE['blush'])
        draw.point([px, py - 3], fill=PALETTE['cream'])

    # 4. Central Fountain Plaza (x=300, y=225)
    fcx, fcy = 300, 225
    draw.ellipse([fcx - 30, fcy - 22, fcx + 30, fcy + 22], fill=PALETTE['outline'])
    draw.ellipse([fcx - 27, fcy - 19, fcx + 27, fcy + 19], fill=PALETTE['cream_dark'])
    draw.ellipse([fcx - 23, fcy - 15, fcx + 23, fcy + 15], fill=PALETTE['blue_deep'])
    draw.ellipse([fcx - 18, fcy - 11, fcx + 18, fcy + 11], fill=PALETTE['blue'])
    # Fountain Tier Pedestal
    draw.rectangle([fcx - 6, fcy - 18, fcx + 6, fcy - 4], fill=PALETTE['outline'])
    draw.rectangle([fcx - 4, fcy - 16, fcx + 4, fcy - 6], fill=PALETTE['cream'])
    draw.ellipse([fcx - 12, fcy - 24, fcx + 12, fcy - 16], fill=PALETTE['cream'], outline=PALETTE['outline'])
    # Sparkling water plume
    draw.line([fcx, fcy - 30, fcx, fcy - 20], fill=PALETTE['cream'], width=2)
    draw.point([fcx - 3, fcy - 26], fill=PALETTE['blue'])
    draw.point([fcx + 3, fcy - 26], fill=PALETTE['blue'])

    # 5. Cedar Bench & Resting Spot (x=360, y=185)
    bx, by = 360, 185
    draw.rectangle([bx - 18, by - 12, bx + 18, by], fill=PALETTE['wood_dark'])
    draw.rectangle([bx - 16, by - 10, bx + 16, by - 2], fill=PALETTE['wood'])
    draw.rectangle([bx - 14, by - 2, bx - 10, by + 8], fill=PALETTE['outline'])
    draw.rectangle([bx + 10, by - 2, bx + 14, by + 8], fill=PALETTE['outline'])

    # 6. Saffron's Shifting Mirror Grove (Northwest: x=90, y=95)
    mx, my = 96, 96
    # Flower garden bed surrounding mirror
    draw.ellipse([mx - 48, my - 24, mx + 48, my + 38], fill=PALETTE['forest_dark'])
    draw.ellipse([mx - 44, my - 20, mx + 44, my + 34], fill=PALETTE['forest'])

    # Rose bushes around the mirror
    rose_color = PALETTE['blush'] if blooming else (180, 160, 175)
    rose_center = PALETTE['berry'] if blooming else (140, 120, 135)
    for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
        rad = math.radians(angle)
        rx = mx + int(math.cos(rad) * 36)
        ry = my + int(math.sin(rad) * 24)
        draw.ellipse([rx - 6, ry - 6, rx + 6, ry + 6], fill=rose_color, outline=PALETTE['outline'])
        draw.ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=rose_center)
        if blooming:
            # Gold sparkle
            draw.point([rx - 1, ry - 1], fill=PALETTE['gold'])

    # The Gilded Mirror
    draw.rectangle([mx - 14, my + 10, mx + 14, my + 26], fill=PALETTE['outline'])
    draw.rectangle([mx - 12, my + 12, mx + 12, my + 24], fill=PALETTE['gold'])
    # Mirror Frame
    draw.ellipse([mx - 18, my - 28, mx + 18, my + 12], fill=PALETTE['outline'])
    draw.ellipse([mx - 16, my - 26, mx + 16, my + 10], fill=PALETTE['gold'])
    draw.ellipse([mx - 14, my - 24, mx + 14, my + 8], fill=PALETTE['gold_light'])
    # Mirror Glass (iridescent pastel)
    draw.ellipse([mx - 12, my - 22, mx + 12, my + 6], fill=PALETTE['lavender'])
    draw.ellipse([mx - 9, my - 19, mx + 9, my + 3], fill=PALETTE['blue'])
    draw.ellipse([mx - 6, my - 16, mx + 6, my], fill=PALETTE['cream'])
    # Star gleam
    draw.line([mx - 4, my - 10, mx + 4, my - 10], fill=PALETTE['cream'], width=2)
    draw.line([mx, my - 14, mx, my - 6], fill=PALETTE['cream'], width=2)

    # 7. Maya's Cozy Lavender Cottage (Northeast: x=430 to 550, y=30 to 140)
    hx, hy = 470, 60
    # Cottage drop shadow
    draw.rectangle([hx - 10, hy + 20, hx + 110, hy + 90], fill=(40, 60, 45, 120))
    # Lavender brick walls
    draw.rectangle([hx, hy + 28, hx + 100, hy + 80], fill=PALETTE['outline'])
    draw.rectangle([hx + 3, hy + 31, hx + 97, hy + 77], fill=PALETTE['lavender'])
    # Brick details
    for r in range(hy + 35, hy + 75, 8):
        for c in range(hx + 8, hx + 92, 14):
            draw.rectangle([c, r, c + 10, r + 4], fill=PALETTE['lavender_dark'])

    # Warm cozy roof (Pink clay tiles with trim)
    draw.polygon([(hx - 12, hy + 30), (hx + 50, hy - 14), (hx + 112, hy + 30)], fill=PALETTE['outline'])
    draw.polygon([(hx - 9, hy + 28), (hx + 50, hy - 11), (hx + 109, hy + 28)], fill=PALETTE['berry'])
    draw.polygon([(hx - 4, hy + 25), (hx + 50, hy - 7), (hx + 104, hy + 25)], fill=PALETTE['blush'])

    # Glowing window
    win_glow = PALETTE['gold_light'] if blooming else PALETTE['gold']
    draw.rectangle([hx + 18, hy + 42, hx + 44, hy + 66], fill=PALETTE['outline'])
    draw.rectangle([hx + 20, hy + 44, hx + 42, hy + 64], fill=win_glow)
    # Window panes
    draw.line([hx + 31, hy + 44, hx + 31, hy + 64], fill=PALETTE['outline'], width=2)
    draw.line([hx + 20, hy + 54, hx + 42, hy + 54], fill=PALETTE['outline'], width=2)

    # Cottage Porch Veranda & Railing
    draw.rectangle([hx + 52, hy + 50, hx + 96, hy + 86], fill=PALETTE['wood_dark'])
    draw.rectangle([hx + 54, hy + 52, hx + 94, hy + 84], fill=PALETTE['wood'])
    # Railing posts
    for rx in range(hx + 58, hx + 94, 9):
        draw.line([rx, hy + 68, rx, hy + 84], fill=PALETTE['wood_dark'], width=2)
    draw.line([hx + 54, hy + 68, hx + 94, hy + 68], fill=PALETTE['wood_dark'], width=2)

    # Porch Flower Boxes
    draw.rectangle([hx + 14, hy + 68, hx + 48, hy + 76], fill=PALETTE['wood_dark'])
    for fx in range(hx + 18, hx + 46, 6):
        draw.ellipse([fx - 2, hy + 65, fx + 4, hy + 71], fill=PALETTE['blush'])
        draw.point([fx + 1, hy + 67], fill=PALETTE['cream'])

    # 8. Eastern Enchanted Forest Gateway (East side: x=530 to 640)
    # Deep ancient trees arching over a dappled forest path
    draw.ellipse([570, 240, 640, 380], fill=PALETTE['forest_dark'])
    # Forest moss carpet
    draw.ellipse([575, 245, 635, 375], fill=PALETTE['forest'])

    # Ancient mossy archway stones
    draw.rectangle([565, 220, 577, 310], fill=PALETTE['cream_dark'], outline=PALETTE['outline'])
    draw.rectangle([620, 220, 632, 310], fill=PALETTE['cream_dark'], outline=PALETTE['outline'])
    draw.ellipse([560, 205, 638, 235], fill=PALETTE['cream_dark'], outline=PALETTE['outline'])
    # Moss on stone arch
    draw.rectangle([566, 230, 574, 250], fill=PALETTE['sage'])
    draw.rectangle([622, 240, 630, 260], fill=PALETTE['sage'])

    # Heart Blossom Pedestal in the forest glade (x=598, y=275)
    draw.ellipse([590, 270, 606, 282], fill=PALETTE['outline'])
    draw.ellipse([592, 272, 604, 280], fill=PALETTE['gold'])
    # Heart flower
    heart_col = PALETTE['blush'] if blooming else (150, 140, 160)
    draw.ellipse([594, 265, 602, 273], fill=heart_col)
    if blooming:
        draw.point([598, 268], fill=PALETTE['cream'])

    # 9. Natural Tree Perimeter with organic spacing (NO rigid lines!)
    tree_coords = [
        # Top edge
        (35, 25, 1.1), (180, 20, 1.2), (280, 25, 1.1), (370, 30, 1.0), (600, 30, 1.3),
        # Northwest grove
        (30, 120, 1.0), (32, 210, 1.1),
        # Southwest grove & pond edge
        (38, 320, 1.2), (40, 420, 1.3), (120, 440, 1.1), (210, 445, 1.2),
        # South edge
        (360, 440, 1.1), (460, 435, 1.2), (560, 440, 1.3),
        # East forest trees
        (610, 120, 1.3), (605, 380, 1.3), (580, 410, 1.1)
    ]
    for tx, ty, tscale in tree_coords:
        create_pixel_tree(draw, tx, ty, tscale)

    # 10. Shrub & Flower Clusters
    shrub_coords = [
        (80, 180, PALETTE['blush']), (140, 150, PALETTE['lavender']),
        (220, 170, PALETTE['cream']), (390, 150, PALETTE['gold']),
        (430, 210, PALETTE['blush']), (490, 230, PALETTE['lavender']),
        (260, 330, PALETTE['gold']), (340, 370, PALETTE['blush']),
        (440, 350, PALETTE['cream']), (520, 330, PALETTE['lavender'])
    ]
    for sx, sy, sfc in shrub_coords:
        create_pixel_bush(draw, sx, sy, rad=11, flower_color=sfc)

    # 11. Wilted vs Blooming flowerbeds along southern path
    flower_bed_y = 390
    for bx in range(250, 480, 28):
        fcol = PALETTE['blush'] if blooming else (160, 145, 155)
        leaf_col = PALETTE['sage_light'] if blooming else (100, 120, 105)
        draw.ellipse([bx - 8, flower_bed_y - 4, bx + 8, flower_bed_y + 4], fill=PALETTE['forest_dark'])
        draw.ellipse([bx - 6, flower_bed_y - 8, bx + 6, flower_bed_y], fill=fcol)
        draw.ellipse([bx - 3, flower_bed_y - 5, bx + 3, flower_bed_y - 1], fill=PALETTE['cream'])
        draw.line([bx - 5, flower_bed_y - 2, bx - 8, flower_bed_y - 4], fill=leaf_col)
        draw.line([bx + 5, flower_bed_y - 2, bx + 8, flower_bed_y - 4], fill=leaf_col)
        if blooming:
            # Sparkle dot
            draw.point([bx, flower_bed_y - 10], fill=PALETTE['gold'])

    return img

def create_player_spritesheet():
    """
    Generate player walk & idle animations.
    4 directions: Down (row 0), Up (row 1), Left (row 2), Right (row 3).
    3 frames each: Idle, Step L, Step R.
    Each frame is 24x32 pixels. Total sheet: 72x128.
    """
    sheet = Image.new('RGBA', (72, 128), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)

    dirs = ['down', 'up', 'left', 'right']
    
    for r_idx, d in enumerate(dirs):
        y_base = r_idx * 32
        for f_idx in range(3):
            x_base = f_idx * 24
            bob = 1 if f_idx in [1, 2] else 0

            # Ground shadow
            draw.ellipse([x_base + 4, y_base + 26, x_base + 20, y_base + 31], fill=(55, 27, 52, 80))

            # Boots
            if d in ['left', 'right']:
                l_off = 2 if f_idx == 1 else (-2 if f_idx == 2 else 0)
                draw.rectangle([x_base + 8 + l_off, y_base + 22, x_base + 12 + l_off, y_base + 27], fill=PALETTE['outline'])
                draw.rectangle([x_base + 13 - l_off, y_base + 22, x_base + 17 - l_off, y_base + 27], fill=PALETTE['outline'])
            else:
                l_off = 1 if f_idx == 1 else 0
                r_off = 1 if f_idx == 2 else 0
                draw.rectangle([x_base + 7, y_base + 22 + l_off, x_base + 11, y_base + 27 + l_off], fill=PALETTE['outline'])
                draw.rectangle([x_base + 13, y_base + 22 + r_off, x_base + 17, y_base + 27 + r_off], fill=PALETTE['outline'])

            # Skirt (Blush pink with cream lace)
            draw.rectangle([x_base + 6, y_base + 15 + bob, x_base + 18, y_base + 22 + bob], fill=PALETTE['outline'])
            draw.rectangle([x_base + 7, y_base + 16 + bob, x_base + 17, y_base + 21 + bob], fill=PALETTE['blush'])
            draw.line([x_base + 7, y_base + 21 + bob, x_base + 17, y_base + 21 + bob], fill=PALETTE['cream'])

            # Sweater (Lavender with Berry heart brooch)
            draw.rectangle([x_base + 7, y_base + 10 + bob, x_base + 17, y_base + 16 + bob], fill=PALETTE['outline'])
            draw.rectangle([x_base + 8, y_base + 11 + bob, x_base + 16, y_base + 15 + bob], fill=PALETTE['lavender'])
            draw.point([x_base + 12, y_base + 13 + bob], fill=PALETTE['berry'])

            # Arms
            if d == 'left':
                draw.rectangle([x_base + 5, y_base + 11 + bob, x_base + 8, y_base + 17 + bob], fill=PALETTE['lavender'], outline=PALETTE['outline'])
            elif d == 'right':
                draw.rectangle([x_base + 16, y_base + 11 + bob, x_base + 19, y_base + 17 + bob], fill=PALETTE['lavender'], outline=PALETTE['outline'])
            else:
                draw.rectangle([x_base + 5, y_base + 11 + bob, x_base + 7, y_base + 16 + bob], fill=PALETTE['lavender'])
                draw.rectangle([x_base + 17, y_base + 11 + bob, x_base + 19, y_base + 16 + bob], fill=PALETTE['lavender'])

            # Head & Neck
            draw.rectangle([x_base + 8, y_base + 4 + bob, x_base + 16, y_base + 11 + bob], fill=PALETTE['skin'])

            # Hair & Face
            if d == 'up':
                # Hair back with ponytail
                draw.rectangle([x_base + 6, y_base + 2 + bob, x_base + 18, y_base + 11 + bob], fill=PALETTE['hair_brown'])
                # Hairclip
                draw.rectangle([x_base + 14, y_base + 3 + bob, x_base + 17, y_base + 6 + bob], fill=PALETTE['berry'])
            else:
                # Hair top & sides
                draw.rectangle([x_base + 6, y_base + 2 + bob, x_base + 18, y_base + 6 + bob], fill=PALETTE['hair_brown'])
                draw.rectangle([x_base + 5, y_base + 5 + bob, x_base + 8, y_base + 11 + bob], fill=PALETTE['hair_brown'])
                draw.rectangle([x_base + 16, y_base + 5 + bob, x_base + 19, y_base + 11 + bob], fill=PALETTE['hair_brown'])
                # Clip
                draw.rectangle([x_base + 14, y_base + 3 + bob, x_base + 17, y_base + 6 + bob], fill=PALETTE['berry'])

                # Face details
                if d == 'down':
                    draw.point([x_base + 10, y_base + 7 + bob], fill=PALETTE['outline'])
                    draw.point([x_base + 14, y_base + 7 + bob], fill=PALETTE['outline'])
                    draw.point([x_base + 9, y_base + 9 + bob], fill=PALETTE['blush'])
                    draw.point([x_base + 15, y_base + 9 + bob], fill=PALETTE['blush'])
                elif d == 'left':
                    draw.point([x_base + 8, y_base + 7 + bob], fill=PALETTE['outline'])
                    draw.point([x_base + 7, y_base + 9 + bob], fill=PALETTE['blush'])
                elif d == 'right':
                    draw.point([x_base + 16, y_base + 7 + bob], fill=PALETTE['outline'])
                    draw.point([x_base + 17, y_base + 9 + bob], fill=PALETTE['blush'])

    return sheet

def create_nihi_spritesheet():
    """
    Generate Nihi's multi-state animated sprite sheet:
    5 states:
    0: Idle & Curious (soft float & ear bob)
    1: Happy & Excited (star sparkles, smiling arc)
    2: Concerned & Empathetic (lowered ears, soft look)
    3: Thoughtful (tilted ears, pondering sparkle)
    4: Encouraging / Cheering (raised paws, golden halo)
    Each state has 2 animation frames (32x32 each). Sheet: 64x160.
    """
    sheet = Image.new('RGBA', (64, 160), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)

    states = ['idle', 'happy', 'concerned', 'thoughtful', 'cheering']

    for s_idx, state_name in enumerate(states):
        y_base = s_idx * 32
        for f_idx in range(2):
            x_base = f_idx * 32
            bob = 2 if f_idx == 1 else 0

            # Shadow
            draw.ellipse([x_base + 8, y_base + 24 - bob, x_base + 24, y_base + 29 - bob], fill=(55, 27, 52, 60))

            # Little Sprout Antenna
            draw.line([x_base + 16, y_base + 5 + bob, x_base + 16, y_base + 10 + bob], fill=PALETTE['sage'], width=2)
            draw.ellipse([x_base + 16, y_base + 3 + bob, x_base + 20, y_base + 7 + bob], fill=PALETTE['sage_light'])

            # Fluffy Bunny-Leaf Ears
            ear_tilt = -3 if state_name == 'concerned' else (3 if state_name == 'happy' else 0)
            draw.ellipse([x_base + 8 + ear_tilt, y_base + 7 + bob, x_base + 13 + ear_tilt, y_base + 15 + bob], fill=PALETTE['blush'], outline=PALETTE['outline'])
            draw.ellipse([x_base + 19 - ear_tilt, y_base + 7 + bob, x_base + 24 - ear_tilt, y_base + 15 + bob], fill=PALETTE['blush'], outline=PALETTE['outline'])

            # Pearlescent Round Body
            draw.ellipse([x_base + 7, y_base + 11 + bob, x_base + 25, y_base + 27 + bob], fill=PALETTE['cream'], outline=PALETTE['outline'])
            # Cream-pink blush gradient
            draw.ellipse([x_base + 9, y_base + 13 + bob, x_base + 23, y_base + 25 + bob], fill=(255, 235, 245))

            # Cheeks
            draw.ellipse([x_base + 8, y_base + 19 + bob, x_base + 12, y_base + 22 + bob], fill=PALETTE['blush'])
            draw.ellipse([x_base + 20, y_base + 19 + bob, x_base + 24, y_base + 22 + bob], fill=PALETTE['blush'])

            # Expressions
            if state_name == 'happy':
                # Crescent eyes ^ ^
                draw.line([x_base + 11, y_base + 17 + bob, x_base + 14, y_base + 15 + bob], fill=PALETTE['outline'], width=2)
                draw.line([x_base + 18, y_base + 15 + bob, x_base + 21, y_base + 17 + bob], fill=PALETTE['outline'], width=2)
                draw.chord([x_base + 14, y_base + 19 + bob, x_base + 18, y_base + 24 + bob], 0, 180, fill=PALETTE['berry'])
                # Sparkles
                draw.point([x_base + 4, y_base + 12 + bob], fill=PALETTE['gold'])
                draw.point([x_base + 27, y_base + 10 + bob], fill=PALETTE['gold'])

            elif state_name == 'concerned':
                # Soft lowered eyes
                draw.ellipse([x_base + 11, y_base + 16 + bob, x_base + 14, y_base + 19 + bob], fill=PALETTE['outline'])
                draw.ellipse([x_base + 18, y_base + 16 + bob, x_base + 21, y_base + 19 + bob], fill=PALETTE['outline'])
                # Wavy mouth
                draw.line([x_base + 14, y_base + 22 + bob, x_base + 18, y_base + 21 + bob], fill=PALETTE['outline'])

            elif state_name == 'thoughtful':
                # Big curious round eyes with catchlight
                draw.ellipse([x_base + 11, y_base + 15 + bob, x_base + 14, y_base + 19 + bob], fill=PALETTE['outline'])
                draw.ellipse([x_base + 18, y_base + 15 + bob, x_base + 21, y_base + 19 + bob], fill=PALETTE['outline'])
                draw.point([x_base + 12, y_base + 16 + bob], fill=PALETTE['cream'])
                draw.point([x_base + 19, y_base + 16 + bob], fill=PALETTE['cream'])
                draw.point([x_base + 16, y_base + 21 + bob], fill=PALETTE['outline'])
                # Sparkle on ear
                draw.point([x_base + 26, y_base + 6 + bob], fill=PALETTE['gold'])

            elif state_name == 'cheering':
                # Cheering celebration: raised paws & halo
                draw.ellipse([x_base + 11, y_base + 16 + bob, x_base + 14, y_base + 18 + bob], fill=PALETTE['outline'])
                draw.ellipse([x_base + 18, y_base + 16 + bob, x_base + 21, y_base + 18 + bob], fill=PALETTE['outline'])
                draw.chord([x_base + 14, y_base + 19 + bob, x_base + 18, y_base + 23 + bob], 0, 180, fill=PALETTE['berry'])
                # Paws up!
                draw.ellipse([x_base + 6, y_base + 12 + bob, x_base + 10, y_base + 16 + bob], fill=PALETTE['cream'], outline=PALETTE['outline'])
                draw.ellipse([x_base + 22, y_base + 12 + bob, x_base + 26, y_base + 16 + bob], fill=PALETTE['cream'], outline=PALETTE['outline'])
                # Golden halo
                draw.arc([x_base + 11, y_base + 2 + bob, x_base + 21, y_base + 6 + bob], 0, 360, fill=PALETTE['gold'])

            else:  # Idle
                # Bright open eyes
                draw.ellipse([x_base + 11, y_base + 16 + bob, x_base + 14, y_base + 19 + bob], fill=PALETTE['outline'])
                draw.ellipse([x_base + 18, y_base + 16 + bob, x_base + 21, y_base + 19 + bob], fill=PALETTE['outline'])
                draw.point([x_base + 12, y_base + 16 + bob], fill=PALETTE['cream'])
                draw.point([x_base + 19, y_base + 16 + bob], fill=PALETTE['cream'])
                draw.point([x_base + 16, y_base + 21 + bob], fill=PALETTE['outline'])

    return sheet

def create_npc_spritesheet():
    """
    Generate in-world pixel art sprites for NPCs:
    - Saffron (standing by the mirror, wavy hair, daisy clip, mint sweater)
    - Maya (sitting in rocking chair on the porch, cozy bun, lavender cardigan)
    Size: 64x64 total (32x64 each).
    """
    sheet = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)

    # 1. Saffron (Left: x=0 to 32, y=16 to 48)
    sx, sy = 16, 20
    # Shadow
    draw.ellipse([sx - 8, sy + 22, sx + 8, sy + 27], fill=(55, 27, 52, 80))
    # Shoes
    draw.rectangle([sx - 5, sy + 20, sx - 2, sy + 24], fill=PALETTE['outline'])
    draw.rectangle([sx + 2, sy + 20, sx + 5, sy + 24], fill=PALETTE['outline'])
    # Cozy long skirt
    draw.rectangle([sx - 6, sy + 12, sx + 6, sy + 21], fill=PALETTE['cream_dark'], outline=PALETTE['outline'])
    # Mint / Sage Oversized Sweater
    draw.rectangle([sx - 7, sy + 4, sx + 7, sy + 13], fill=PALETTE['sage'], outline=PALETTE['outline'])
    draw.rectangle([sx - 5, sy + 5, sx + 5, sy + 12], fill=PALETTE['sage_light'])
    # Head & Wavy Hair
    draw.rectangle([sx - 5, sy - 2, sx + 5, sy + 4], fill=PALETTE['skin'])
    draw.ellipse([sx - 7, sy - 8, sx + 7, sy + 2], fill=PALETTE['hair_brown'])
    # Wavy side hair
    draw.ellipse([sx - 8, sy - 3, sx - 4, sy + 8], fill=PALETTE['hair_brown'])
    draw.ellipse([sx + 4, sy - 3, sx + 8, sy + 8], fill=PALETTE['hair_brown'])
    # Daisy clip in hair
    draw.ellipse([sx + 4, sy - 5, sx + 8, sy - 1], fill=PALETTE['cream'])
    draw.point([sx + 6, sy - 3], fill=PALETTE['gold'])
    # Eyes & smile
    draw.point([sx - 2, sy + 1], fill=PALETTE['outline'])
    draw.point([sx + 2, sy + 1], fill=PALETTE['outline'])
    draw.point([sx, sy + 3], fill=PALETTE['berry'])

    # 2. Maya (Right: x=32 to 64, resting in porch rocking chair)
    mx, my = 48, 22
    # Chair rocker base
    draw.arc([mx - 10, my + 18, mx + 10, my + 28], 180, 360, fill=PALETTE['wood_dark'], width=2)
    draw.line([mx - 8, my + 10, mx - 6, my + 24], fill=PALETTE['wood_dark'], width=2)
    draw.line([mx + 8, my + 10, mx + 6, my + 24], fill=PALETTE['wood_dark'], width=2)
    draw.line([mx - 9, my + 4, mx - 9, my + 18], fill=PALETTE['wood'], width=2) # Backrest
    # Maya seated in lavender cardigan with warm shawl
    draw.rectangle([mx - 6, my + 8, mx + 6, my + 20], fill=PALETTE['lavender'], outline=PALETTE['outline'])
    draw.rectangle([mx - 4, my + 12, mx + 4, my + 18], fill=PALETTE['blush']) # Cozy lap blanket
    # Head & Messy Bun
    draw.rectangle([mx - 4, my + 2, mx + 4, my + 8], fill=PALETTE['skin'])
    draw.ellipse([mx - 6, my - 3, mx + 6, my + 5], fill=PALETTE['hair_brown'])
    # Messy bun top
    draw.ellipse([mx - 4, my - 8, mx + 4, my - 2], fill=PALETTE['hair_brown'])
    # Pink scrunchie
    draw.ellipse([mx - 3, my - 4, mx + 3, my - 2], fill=PALETTE['berry'])
    # Gentle resting face
    draw.line([mx - 2, my + 5, mx - 1, my + 5], fill=PALETTE['outline'])
    draw.line([mx + 1, my + 5, mx + 2, my + 5], fill=PALETTE['outline'])
    draw.point([mx, my + 7], fill=PALETTE['berry'])

    return sheet

if __name__ == '__main__':
    print("Generating authentic 16-bit pixel art maps and sprites...")
    
    # 1. Base Garden Map
    map_base = generate_map(blooming=False)
    map_base.save('assets/map_base.png')
    print("Saved assets/map_base.png")

    # 2. Blooming Garden Map
    map_bloom = generate_map(blooming=True)
    map_bloom.save('assets/map_blooming.png')
    print("Saved assets/map_blooming.png")

    # 3. Player Sprite Sheet
    player_sheet = create_player_spritesheet()
    player_sheet.save('assets/player_sprites.png')
    print("Saved assets/player_sprites.png")

    # 4. Nihi Multi-State Sprite Sheet
    nihi_sheet = create_nihi_spritesheet()
    nihi_sheet.save('assets/nihi_sprites.png')
    print("Saved assets/nihi_sprites.png")

    # 5. NPC Sprite Sheet
    npc_sheet = create_npc_spritesheet()
    npc_sheet.save('assets/npc_sprites.png')
    print("Saved assets/npc_sprites.png")

    print("All pixel-art game assets generated successfully!")
