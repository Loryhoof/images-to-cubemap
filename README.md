# Cubemap Creator

A free, browser-based tool to create cubemap cross layouts from 6 images. Perfect for game developers and 3D artists who need skybox textures for Unity, Unreal Engine, Three.js, and other 3D engines.

**Live at:** [cubemap.kevinlabs.com](https://cubemap.kevinlabs.com)

## Features

- **Drag & Drop** – Upload images individually or drop all 6 at once
- **Smart Detection** – Automatically places images based on filename patterns (px, nx, posx, negx, right, left, etc.)
- **Reorder by Dragging** – Swap face positions by dragging images between slots
- **Export as PNG** – Downloads a 2048×1536 cross layout ready for import
- **No Backend** – Everything runs client-side, your images never leave your browser

## Usage

1. Upload 6 images (one for each cube face)
2. Arrange them in the correct positions if needed
3. Click "Export PNG" to download your cubemap

The exported image uses the standard cross layout:

```
     [Top]
[Left][Front][Right][Back]
    [Bottom]
```

## Supported Filename Patterns

The tool auto-detects face names from common conventions:

| Face   | Patterns                                    |
|--------|---------------------------------------------|
| Right  | `px`, `posx`, `+x`, `right`                |
| Left   | `nx`, `negx`, `-x`, `left`                 |
| Top    | `py`, `posy`, `+y`, `top`, `up`            |
| Bottom | `ny`, `negy`, `-y`, `bottom`, `down`       |
| Front  | `pz`, `posz`, `+z`, `front`, `forward`     |
| Back   | `nz`, `negz`, `-z`, `back`, `backward`     |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Author

Made by [Kevin Klatt](https://x.com/klattkev)
