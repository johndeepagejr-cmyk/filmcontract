#!/usr/bin/env python3
"""
FilmContract — App Store Screenshot Generator

Generates App Store screenshots with device frames, branded backgrounds,
and marketing text for all required device sizes.

Usage:
    python3 scripts/generate-screenshots.py --screens-dir ./screenshot-captures --output-dir ./store-screenshots

Prerequisites:
    pip3 install Pillow

Input:
    - 6 PNG screen captures (1290x2796 each, from iPhone 14 Pro Max simulator)
    - Named: 01_casting_feed.png, 02_recorder.png, 03_editor.png,
             04_pipeline.png, 05_contract.png, 06_payments.png

Output:
    - Screenshots for each device size in the output directory
    - Organized by device: iphone_6_9/, iphone_6_7/, iphone_6_5/, iphone_6_1/
"""

import os
import sys
import argparse
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    print("Error: Pillow is required. Install with: pip3 install Pillow")
    sys.exit(1)


# ─── Configuration ───────────────────────────────────────────────────────────

BRAND_COLOR_TOP = (26, 26, 46)       # #1A1A2E
BRAND_COLOR_BOTTOM = (10, 126, 164)  # #0A7EA4
BRAND_COLOR_ACCENT = (10, 126, 164)  # #0A7EA4

DEVICE_SIZES = {
    "iphone_6_9": {"width": 1320, "height": 2868, "label": "iPhone 16 Pro Max (6.9\")"},
    "iphone_6_7": {"width": 1290, "height": 2796, "label": "iPhone 14 Pro Max (6.7\")"},
    "iphone_6_5": {"width": 1284, "height": 2778, "label": "iPhone 14 Plus (6.5\")"},
    "iphone_6_1": {"width": 1170, "height": 2532, "label": "iPhone 14 Pro (6.1\")"},
    "ipad_13":    {"width": 2064, "height": 2752, "label": "iPad Pro 13\""},
}

SCREENSHOTS = [
    {
        "filename": "01_casting_feed.png",
        "headline": "Find Your Role",
        "subheadline": "Browse casting calls with smart filters",
    },
    {
        "filename": "02_recorder.png",
        "headline": "Record Like a Pro",
        "subheadline": "Built-in teleprompter and 4K quality",
    },
    {
        "filename": "03_editor.png",
        "headline": "Edit & Submit",
        "subheadline": "Trim, add slate, compress, upload",
    },
    {
        "filename": "04_pipeline.png",
        "headline": "Manage Talent",
        "subheadline": "Review submissions in a Kanban pipeline",
    },
    {
        "filename": "05_contract.png",
        "headline": "Sign Instantly",
        "subheadline": "Generate contracts and e-sign in-app",
    },
    {
        "filename": "06_payments.png",
        "headline": "Get Paid Safely",
        "subheadline": "Funds held in escrow until work is done",
    },
]


# ─── Helpers ─────────────────────────────────────────────────────────────────

def create_gradient(width: int, height: int, color_top: tuple, color_bottom: tuple) -> Image.Image:
    """Create a vertical linear gradient background."""
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        r = int(color_top[0] + (color_bottom[0] - color_top[0]) * ratio)
        g = int(color_top[1] + (color_bottom[1] - color_top[1]) * ratio)
        b = int(color_top[2] + (color_bottom[2] - color_top[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return img


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Get a font, falling back to default if system fonts aren't available."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/SFProDisplay-Bold.otf" if bold
        else "/System/Library/Fonts/SFProDisplay-Regular.otf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def add_device_frame(screen: Image.Image, canvas_width: int, canvas_height: int) -> Image.Image:
    """Add a simple device frame (rounded rectangle) around the screen capture."""
    # Scale screen to 70% of canvas width
    device_width = int(canvas_width * 0.70)
    screen_ratio = screen.height / screen.width
    device_height = int(device_width * screen_ratio)

    # Resize screen
    screen_resized = screen.resize((device_width, device_height), Image.LANCZOS)

    # Create frame (slightly larger than screen with rounded corners)
    frame_padding = int(device_width * 0.03)
    frame_width = device_width + frame_padding * 2
    frame_height = device_height + frame_padding * 2
    corner_radius = int(frame_width * 0.06)

    frame = Image.new("RGBA", (frame_width, frame_height), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle(
        [(0, 0), (frame_width - 1, frame_height - 1)],
        radius=corner_radius,
        fill=(30, 30, 30, 255),
        outline=(60, 60, 60, 255),
        width=2,
    )

    # Paste screen into frame
    screen_rgba = screen_resized.convert("RGBA")
    frame.paste(screen_rgba, (frame_padding, frame_padding))

    return frame


def generate_screenshot(
    screen_path: str,
    headline: str,
    subheadline: str,
    canvas_width: int,
    canvas_height: int,
    output_path: str,
) -> None:
    """Generate a single App Store screenshot."""
    # Create gradient background
    canvas = create_gradient(canvas_width, canvas_height, BRAND_COLOR_TOP, BRAND_COLOR_BOTTOM)
    draw = ImageDraw.Draw(canvas)

    # Calculate font sizes relative to canvas
    headline_size = int(canvas_width * 0.065)
    subheadline_size = int(canvas_width * 0.032)

    headline_font = get_font(headline_size, bold=True)
    subheadline_font = get_font(subheadline_size, bold=False)

    # Draw headline (centered, top area)
    text_y = int(canvas_height * 0.06)
    headline_bbox = draw.textbbox((0, 0), headline, font=headline_font)
    headline_width = headline_bbox[2] - headline_bbox[0]
    headline_x = (canvas_width - headline_width) // 2
    draw.text((headline_x, text_y), headline, fill=(255, 255, 255), font=headline_font)

    # Draw subheadline
    sub_y = text_y + headline_size + int(canvas_height * 0.015)
    sub_bbox = draw.textbbox((0, 0), subheadline, font=subheadline_font)
    sub_width = sub_bbox[2] - sub_bbox[0]
    sub_x = (canvas_width - sub_width) // 2
    draw.text((sub_x, sub_y), subheadline, fill=(255, 255, 255, 204), font=subheadline_font)

    # Load and frame the screen capture
    if os.path.exists(screen_path):
        screen = Image.open(screen_path).convert("RGBA")
        framed = add_device_frame(screen, canvas_width, canvas_height)

        # Position device in bottom 75% of canvas
        device_x = (canvas_width - framed.width) // 2
        device_y = int(canvas_height * 0.22)

        # Ensure device doesn't overflow canvas
        if device_y + framed.height > canvas_height:
            # Crop bottom of device frame
            crop_height = canvas_height - device_y
            framed = framed.crop((0, 0, framed.width, crop_height))

        canvas.paste(framed, (device_x, device_y), framed)
    else:
        # Placeholder if screen capture not found
        placeholder_text = f"[Screen: {os.path.basename(screen_path)}]"
        ph_font = get_font(int(canvas_width * 0.04))
        ph_bbox = draw.textbbox((0, 0), placeholder_text, font=ph_font)
        ph_x = (canvas_width - (ph_bbox[2] - ph_bbox[0])) // 2
        ph_y = canvas_height // 2
        draw.text((ph_x, ph_y), placeholder_text, fill=(255, 255, 255, 128), font=ph_font)

    # Save
    canvas.save(output_path, "PNG", dpi=(72, 72))
    print(f"  ✓ {output_path}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate App Store screenshots")
    parser.add_argument(
        "--screens-dir",
        default="./screenshot-captures",
        help="Directory containing raw screen captures (default: ./screenshot-captures)",
    )
    parser.add_argument(
        "--output-dir",
        default="./store-screenshots",
        help="Output directory for generated screenshots (default: ./store-screenshots)",
    )
    parser.add_argument(
        "--devices",
        nargs="+",
        default=list(DEVICE_SIZES.keys()),
        choices=list(DEVICE_SIZES.keys()),
        help="Device sizes to generate (default: all)",
    )
    args = parser.parse_args()

    screens_dir = Path(args.screens_dir)
    output_dir = Path(args.output_dir)

    print(f"\n📱 FilmContract Screenshot Generator")
    print(f"   Input:  {screens_dir}")
    print(f"   Output: {output_dir}\n")

    for device_key in args.devices:
        device = DEVICE_SIZES[device_key]
        device_dir = output_dir / device_key
        device_dir.mkdir(parents=True, exist_ok=True)

        print(f"Generating for {device['label']} ({device['width']}x{device['height']}):")

        for i, shot in enumerate(SCREENSHOTS, 1):
            screen_path = str(screens_dir / shot["filename"])
            output_path = str(device_dir / f"{i:02d}_{shot['filename']}")

            generate_screenshot(
                screen_path=screen_path,
                headline=shot["headline"],
                subheadline=shot["subheadline"],
                canvas_width=device["width"],
                canvas_height=device["height"],
                output_path=output_path,
            )

        print()

    print("✅ All screenshots generated!")
    print(f"\nNext steps:")
    print(f"  1. Capture app screens on iPhone 14 Pro Max simulator")
    print(f"  2. Save as 01_casting_feed.png through 06_payments.png in {screens_dir}/")
    print(f"  3. Re-run this script to composite with device frames and text")
    print(f"  4. Upload to App Store Connect and Google Play Console\n")


if __name__ == "__main__":
    main()
