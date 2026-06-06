# Suárez Family Mexico 2026

A static, mobile-first Progressive Web App for the Suárez family Mexico trip from 19 June to 21 July 2026.

## What is inside

- `index.html` is the app entry point.
- `styles.css` controls the warm travel-agency look.
- `app.js` loads the trip data and renders each section.
- `manifest.json` makes the site installable as a PWA.
- `service-worker.js` caches the app for basic offline support.
- `data/*.json` holds editable trip data.

## Run locally

You can open `index.html` directly in a browser to view the app shell.

For the full app data to load exactly like GitHub Pages, run a tiny local server from this folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Some browsers block local JSON loading from a double-clicked `file://` page, which is why the local server is the most reliable test.

## Push to GitHub

```bash
git init
git add .
git commit -m "Create Mexico 2026 family trip PWA"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with your own GitHub details.

## Enable GitHub Pages

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select branch `main`.
6. Select folder `/root`.
7. Click `Save`.

GitHub will give you a public Pages link after it deploys.

## Add to iPhone Home Screen

1. Open the GitHub Pages link in Safari on the iPhone.
2. Tap the Share button.
3. Tap `Add to Home Screen`.
4. Keep the name or rename it to `Mexico 2026`.
5. Tap `Add`.

The app will open from the Home Screen like a small family travel app.
