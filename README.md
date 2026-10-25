<div align="center">

# PixelForge

**Convert images in seconds — right in your browser.**

Drop an image, pick a format, download it. No uploads, no accounts, no server round-trips.
Every pixel is decoded and re-encoded locally with the Canvas API.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

![PixelForge landing page](preview.png)

---

## Features

- **100% client-side** — files never leave the device. There is no upload endpoint, no database, and no analytics on image data.
- **Batch conversion** — select or drag several files at once; each is converted in sequence and can be downloaded individually.
- **Format detection** — the app asks the browser which encoders it actually supports and only offers those, so you never get a silently mislabelled file.
- **Quality control** — a 40–100 slider for lossy formats (JPG, WebP).
- **Transparency handling** — converting to JPG flattens alpha onto a background colour you pick (white by default).
- **Drag and drop** — drop files anywhere on the card, or click to browse.
- **Responsive dark UI** — built mobile-first, tuned against a 1585 × 992 reference layout.
- **Accessible touches** — keyboard-operable controls, `Escape` closes the help dialog, visible focus rings, `aria-pressed` on the format picker.

## Supported formats

| Direction | Formats |
| --- | --- |
| **Input** | Anything the browser can decode — JPG, PNG, WebP, AVIF, GIF, BMP, SVG, and more |
| **Output** | JPG, PNG, WebP, plus AVIF where the browser implements it |

A few honest details:

- **AVIF** is offered only when the browser can encode it: support is probed at runtime with `canvas.toDataURL("image/avif")`, and the option is hidden when the engine falls back to PNG (most currently do).
- **GIF and TIFF** appear on the landing card as decorative badges, not as output options — the Canvas API cannot encode either. Animated inputs are flattened to their first frame.
- The quality slider only appears for lossy formats; PNG is always lossless.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS v4 — CSS-first `@theme` tokens, no `tailwind.config.js` |
| Type | Plus Jakarta Sans via `next/font` (self-hosted at build time) |
| Icons | lucide-react |
| Image engine | Canvas 2D API + `Blob` object URLs |
| Type checking | `next build` (TypeScript) — no separate ESLint setup yet |

## Getting started

**Requirements:** Node.js 20.9 or newer (developed on Node 24) and npm.

```bash
git clone https://github.com/Devesh-NEMO/PixelForge.git
cd PixelForge
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** prefer `http://localhost:3000`. Next.js 16 only lets its dev client connect from known origins, so opening the app through `127.0.0.1` can render the page without interactivity. `next.config.js` already lists `127.0.0.1` in `allowedDevOrigins`, but `localhost` is the safest choice.

### Production build

```bash
npm run build
npm start
```

The build is fully static — `/` and `/convert` are prerendered, and no environment variables are required.

## Project structure

```
pixelforge/
├── app/
│   ├── layout.tsx          # Fonts, metadata, <html>/<body> shell
│   ├── page.tsx            # Landing page: hero, converter, privacy note
│   ├── convert/page.tsx    # Legacy route — 307 redirect to /
│   └── globals.css         # Tailwind import + @theme design tokens
├── components/
│   ├── image-converter.tsx # Upload, preview, convert, results (client)
│   ├── site-header.tsx     # Wordmark + "How it works" entry point
│   ├── site-footer.tsx     # Version line
│   └── how-it-works.tsx    # Accessible modal with the 3-step explainer
├── next.config.js
├── postcss.config.mjs      # @tailwindcss/postcss
└── preview.png             # Screenshot used in this README
```

## How it works

1. **Pick files** — the `<input type="file" accept="image/*" multiple>` is fed by drag-and-drop or the click target; object URLs are created once per selection and revoked when it changes.
2. **Choose a format** — on mount, the app probes `canvas.toDataURL()` for each MIME type and keeps only the encoders the browser actually supports.
3. **Convert** — each file is decoded with `HTMLImageElement.decode()`, drawn to an offscreen canvas (filling the background first for JPG), then re-encoded through `canvas.toBlob()`.
4. **Download** — the resulting blob is wrapped in an object URL and exposed as a native `<a download>` link. A run-id guard cancels in-flight work if the user resets mid-conversion.

Everything runs on the main thread, so converting a batch of very large images may briefly block the UI.

## Browser support

PixelForge targets evergreen browsers: **Chrome / Edge 111+**, **Safari 16.4+**, **Firefox 128+**. Tailwind CSS v4 emits modern CSS (`color-mix()`, `@property`, `oklab` colour spaces) that older engines cannot parse.

AVIF *output* depends on the engine; everything else is available wherever `<canvas>` and `Blob` are.

## Deployment

The app is a standard Next.js project with no server-side state, so any Node host works. On Vercel: import the repository, accept the detected defaults, deploy — no configuration needed.

```bash
npm run build   # verify locally first
```

## Known limitations

- Animated GIF/WebP inputs convert only their first frame.
- GIF, TIFF, BMP and ICO outputs are not possible with `canvas.toBlob`.
- Extremely large images are bounded by device memory, not by the app.
- Conversion is synchronous per file; a Web Worker pass would be the next step for very large batches.

## Contributing

Issues and pull requests are welcome. Please run `npm run build` before opening a PR — it type-checks the whole project.

## License

No license has been chosen for this repository yet. Until one is added, the code is "all rights reserved" by default — add a `LICENSE` file (MIT is a good default) if you intend to let others use it.
