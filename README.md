# qquway · Portfolio (Static Edition)

> A fully static, Vercel-ready fork of the portfolio. No backend required.
> Data lives in `data/` JSON files. Managed via the interactive CLI.

---

## Quick Start

```bash
npm install
npm run manage   # interactive data manager
npm run dev      # local dev server
npm run build    # production build → dist/
```

---

## File Structure

```
portfolio-static/
├── data/
│   ├── about.json       ← About Me content
│   └── projects.json    ← Projects list
├── public/
│   └── uploads/
│       ├── cv/          ← CV file served as /uploads/cv/cv.pdf
│       └── images/      ← Project images served as /uploads/images/*
├── src/                 ← React source (no backend calls)
├── manage.js            ← CLI management tool
├── vercel.json          ← Vercel deployment config
└── package.json
```

---

## manage.js — CLI Tool

Run with `npm run manage` or `node manage.js`.

```
Main Menu
  1  Manage About Me          → edit username, alias, role, background, skills, certs
  2  Manage Projects          → list, add, edit, delete projects
  3  Upload / Replace CV      → copies your PDF to public/uploads/cv/cv.pdf
                                and updates about.json automatically
  4  Upload Project Image     → copies image to public/uploads/images/
                                optionally attaches it to a project
  5  Build for Production     → runs vite build → dist/
  6  Preview Production Build → serves dist/ locally
  0  Exit
```

---

## Deploying to Vercel

### Option A — Vercel CLI
```bash
npm install -g vercel
npm run build
vercel --prod
```

### Option B — Vercel Dashboard
1. Push this folder to a GitHub repo
2. Import the repo at https://vercel.com/new
3. Set **Root Directory** to `portfolio-static/`
4. Vercel auto-detects Vite — build command `npm run build`, output `dist`

### Option C — Drag & Drop
1. `npm run build`
2. Go to https://vercel.com/new → drag the `dist/` folder

---

## Typical Workflow

```bash
node manage.js     # edit data, upload files
npm run build      # build
vercel --prod      # deploy
```

---

## Data Format

### `data/about.json`
```json
{
  "username": "qquway",
  "alias": "qquway",
  "legal_identity": "Rifqi Habib Ur Rahman",
  "role": "Embedded Systems Engineer, Linux Enthusiast",
  "background": "...",
  "skills": ["C", "Rust", "Python"],
  "certifications": ["Cisco CCNAV1"],
  "cv_path": "/uploads/cv/cv.pdf"
}
```

### `data/projects.json`
```json
[
  {
    "id": 1,
    "title": "Project Name",
    "description": "Short one-liner",
    "content": "Full description shown on detail page",
    "images": ["/uploads/images/screenshot.png"],
    "link": "https://github.com/qquway/..."
  }
]
```
