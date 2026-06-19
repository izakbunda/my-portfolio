#!/usr/bin/env python3
"""
retro.py — make any photo look old and pixelated
Usage: python3 retro.py <input_image> [output_image] [--pixel-size N]
"""

import sys
import argparse
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
    import numpy as np
except ImportError:
    print("Missing dependencies. Run:\n  pip3 install Pillow numpy")
    sys.exit(1)


def pixelate(img: Image.Image, pixel_size: int) -> Image.Image:
    small = img.resize(
        (max(1, img.width // pixel_size), max(1, img.height // pixel_size)),
        Image.NEAREST,
    )
    return small.resize(img.size, Image.NEAREST)


def fade_and_crush(img: Image.Image) -> Image.Image:
    # Desaturate partially so colors are washed out
    img = ImageEnhance.Color(img).enhance(0.3)
    # Reduce contrast so blacks lift and whites dim (faded print look)
    img = ImageEnhance.Contrast(img).enhance(0.6)
    # Lift the blacks toward a muddy brown
    arr = np.array(img, dtype=np.float32)
    arr = arr * 0.75 + np.array([28, 20, 10], dtype=np.float32)
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8))


def sepia(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGB"), dtype=np.float32)
    r = arr[:, :, 0] * 0.393 + arr[:, :, 1] * 0.769 + arr[:, :, 2] * 0.189
    g = arr[:, :, 0] * 0.349 + arr[:, :, 1] * 0.686 + arr[:, :, 2] * 0.168
    b = arr[:, :, 0] * 0.272 + arr[:, :, 1] * 0.534 + arr[:, :, 2] * 0.131
    return Image.fromarray(np.stack([r, g, b], axis=2).clip(0, 255).astype(np.uint8))


def posterize(img: Image.Image, levels: int = 4) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    arr = np.floor(arr / 255 * (levels - 1) + 0.5) / (levels - 1) * 255
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8))


def add_grain(img: Image.Image, intensity: float = 55.0) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, intensity, arr.shape)
    return Image.fromarray((arr + noise).clip(0, 255).astype(np.uint8))


def scanlines(img: Image.Image, gap: int = 3, darkness: float = 0.45) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    for y in range(0, arr.shape[0], gap):
        arr[y] = arr[y] * (1 - darkness)
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8))


def scratches(img: Image.Image, count: int = 18) -> Image.Image:
    draw = ImageDraw.Draw(img)
    w, h = img.size
    for _ in range(count):
        x = np.random.randint(0, w)
        length = np.random.randint(h // 6, h // 2)
        y0 = np.random.randint(0, h - length)
        brightness = np.random.randint(160, 230)
        color = (brightness, int(brightness * 0.85), int(brightness * 0.65))
        thickness = 1 if np.random.random() < 0.8 else 2
        draw.line([(x, y0), (x + np.random.randint(-4, 4), y0 + length)], fill=color, width=thickness)
    return img


def dust(img: Image.Image, count: int = 120) -> Image.Image:
    draw = ImageDraw.Draw(img)
    w, h = img.size
    for _ in range(count):
        x, y = np.random.randint(0, w), np.random.randint(0, h)
        r = np.random.randint(1, 4)
        alpha = np.random.randint(60, 180)
        draw.ellipse([x, y, x + r, y + r], fill=(200, 180, 140, alpha))
    return img.convert("RGB")


def vignette(img: Image.Image, strength: float = 1.1) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape[:2]
    y = np.linspace(-1, 1, h)[:, np.newaxis]
    x = np.linspace(-1, 1, w)[np.newaxis, :]
    mask = 1 - strength * (x ** 2 + y ** 2)
    mask = np.clip(mask, 0, 1)[:, :, np.newaxis]
    return Image.fromarray((arr * mask).clip(0, 255).astype(np.uint8))


def process(input_path: str, output_path: str, pixel_size: int):
    img = Image.open(input_path).convert("RGB")
    print(f"Loaded:  {input_path}  ({img.width}x{img.height})")

    img = fade_and_crush(img)
    img = sepia(img)
    img = posterize(img, levels=4)
    img = scanlines(img, gap=3, darkness=0.4)
    img = add_grain(img, intensity=55)
    img = scratches(img, count=20)
    img = dust(img.convert("RGBA"), count=130)
    img = vignette(img, strength=1.1)
    # pixelate last so blocks stay sharp and visible
    img = pixelate(img, pixel_size)

    img.save(output_path, quality=82)
    print(f"Saved:   {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Make a photo look old and pixelated.")
    parser.add_argument("input", help="Path to the input image")
    parser.add_argument("output", nargs="?", help="Output path (default: <input>_retro.<ext>)")
    parser.add_argument("--pixel-size", type=int, default=14, help="Pixel block size (default: 14, higher = chunkier)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: file not found — {args.input}")
        sys.exit(1)

    output_path = args.output or str(input_path.with_stem(input_path.stem + "_retro"))
    process(str(input_path), output_path, args.pixel_size)


if __name__ == "__main__":
    main()
