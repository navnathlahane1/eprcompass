# Step 2: Maritime Promoter – Logos & Favicons

## What’s already done in code

- **site.webmanifest** – Name and short name set to **Maritime Promoter**; description updated for maritime.
- **Navbar & Footer** – Use `/imgs/android-chrome-512x512.png` as the main logo (alt: "Maritime Promoter Logo").
- **layout.js** – All favicon and icon links point to the paths below.

---

## Image files you need to replace

Put your **Maritime Promoter** logo/favicon in these paths. The site will use them automatically.

| File | Location | Recommended size | Used for |
|------|----------|-------------------|----------|
| **favicon.ico** | `frontend/public/imgs/favicon.ico` | 32×32 or 16×16 | Browser tab icon |
| **favicon-16x16.png** | `frontend/public/imgs/favicon-16x16.png` | 16×16 | Small favicon |
| **favicon-32x32.png** | `frontend/public/imgs/favicon-32x32.png` | 32×32 | Standard favicon |
| **android-chrome-192x192.png** | `frontend/public/imgs/android-chrome-192x192.png` | 192×192 | PWA / Android home screen |
| **android-chrome-512x512.png** | `frontend/public/imgs/android-chrome-512x512.png` | 512×512 | **Main logo** (navbar, footer), PWA splash |
| **apple-touch-icon.png** | `frontend/public/imgs/apple-touch-icon.png` | 180×180 | iOS home screen |

Also in `frontend/public/` (root): **favicon.ico** – some tools expect it at the root. You can copy the same file from `imgs/favicon.ico`.

---

## Optional cleanup

- **doctor-logo-1.jpg** in `frontend/public/imgs/` is not used anywhere in the code. You can delete it or replace it with a Maritime Promoter image if you plan to use it later.

---

## Quick way to generate all sizes

1. Create one square logo (e.g. 512×512 PNG).
2. Use a favicon generator (e.g. [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net)) to get all sizes.
3. Replace the files in `frontend/public/imgs/` (and root `favicon.ico` if needed).

Step 2 (code and config) is complete. After you replace these image files with your Maritime Promoter assets, logos and favicons will be fully rebranded.
