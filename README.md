Gift/First_Try — birthday single-page site

What I created
- `index.html` — single responsive page with a message, gallery placeholders and a confetti canvas.
- `styles.css` — simple accessible styling.
- `script.js` — gallery/slideshow logic and a small confetti animation triggered when the message is revealed.
-- `assets/` — folder for images. Put files named `photo1.jpg`, `photo2.jpg`, ... up to `photo20.jpg` and the script will auto-detect them and create thumbnail previews.

How to preview locally
1. Open `index.html` in a browser (double-click it). For the best experience, serve it with a simple local server.

Quick local server (PowerShell):

```powershell
# run from inside the Gift/First_Try folder
python -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Deploy options (share by link only)
- Netlify (recommended for easy drag-and-drop publish):
  1. Zip the contents of the `First_Try` folder (not the folder itself) or drag the folder into Netlify Drop at https://app.netlify.com/drop
  2. Netlify will publish a unique URL you can copy and share.
- GitHub Pages:
  1. Create a new repository, push these files, then enable Pages from the repository settings. The site will be at `https://<username>.github.io/<repo>/`.

How to personalize
- Put your favorite photos in `assets/` and name them `photo1.jpg`, `photo2.jpg`, ... (up to `photo20.jpg`). Thumbnails will be created automatically.
- Edit the message in `index.html` (`#giftText`) to use your own words.
- If you want more than 20 photos, edit `script.js` and increase `MAX_PHOTOS`.

Next steps I can do for you
- Add smoother transitions, a print-friendly card, or password-protect the page (requires a simple backend or obfuscation).
- I can zip the folder and prepare a Netlify deployment for you.
