"""Generate PWA icons for nutrition tracker (Prompt #2)."""
from PIL import Image, ImageDraw, ImageFont

BG = "#1a1d27"
GREEN = "#22c55e"
BORDER = "#2e3352"
ACCENT = "#4f8aff"
MUTED = "#8b90a7"


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    pad = int(size * 0.08)
    radius = int(size * 0.18)
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=BG, outline=BORDER, width=max(2, size // 128))

    cx, cy = size // 2, size // 2
    r_plate = int(size * 0.31)
    draw.ellipse([cx - r_plate, cy - r_plate, cx + r_plate, cy + r_plate], outline=BORDER, width=max(3, size // 64))

    # Fork (left)
    fx = int(size * 0.29)
    fw = max(2, size // 64)
    for dx in (-fw * 2, 0, fw * 2):
        draw.rounded_rectangle([fx + dx, int(size * 0.31), fx + dx + fw, int(size * 0.58)], radius=fw, fill=ACCENT)
    draw.rounded_rectangle([fx - fw * 2, int(size * 0.44), fx + fw * 3, int(size * 0.44) + fw], radius=fw, fill=ACCENT)
    draw.rounded_rectangle([fx, int(size * 0.56), fx + fw, int(size * 0.72)], radius=fw, fill=ACCENT)

    # Stylized "ע" (Ayin) — green accent
    font_size = int(size * 0.36)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except OSError:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
        except OSError:
            font = ImageFont.load_default()

    letter = "\u05e2"
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1] + int(size * 0.02)
    draw.text((tx, ty), letter, fill=GREEN, font=font)

    # Small calorie dot accent
    dot_r = max(3, size // 40)
    draw.ellipse([cx + int(size * 0.22) - dot_r, cy - int(size * 0.28) - dot_r, cx + int(size * 0.22) + dot_r, cy - int(size * 0.28) + dot_r], fill=GREEN)

    return img


def main():
    for name, dim in [("icon-192.png", 192), ("icon-512.png", 512)]:
        draw_icon(dim).save(name, "PNG")
        print(f"Wrote {name} ({dim}x{dim})")


if __name__ == "__main__":
    main()
