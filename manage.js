#!/usr/bin/env node
/**
 * manage.js — Portfolio Static Site Manager
 * Run with:  node manage.js  OR  npm run manage
 *
 * Manages:
 *  - About Me data  (data/about.json)
 *  - Projects       (data/projects.json)
 *  - CV upload      (copies to public/uploads/cv/)
 *  - Image upload   (copies to public/uploads/images/)
 *  - Build & preview
 */

import fs   from 'fs';
import path from 'path';
import rl   from 'readline';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Paths ────────────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const ABOUT_FILE  = path.join(DATA_DIR, 'about.json');
const PROJ_FILE   = path.join(DATA_DIR, 'projects.json');
const CV_DIR      = path.join(__dirname, 'public', 'uploads', 'cv');
const IMG_DIR     = path.join(__dirname, 'public', 'uploads', 'images');

// ── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  pink:   '\x1b[35m',
  dim:    '\x1b[2m',
};

const g  = s => `${C.green}${s}${C.reset}`;
const cy = s => `${C.cyan}${s}${C.reset}`;
const y  = s => `${C.yellow}${s}${C.reset}`;
const r  = s => `${C.red}${s}${C.reset}`;
const p  = s => `${C.pink}${s}${C.reset}`;
const b  = s => `${C.bold}${s}${C.reset}`;
const d  = s => `${C.dim}${s}${C.reset}`;

// ── Readline interface ────────────────────────────────────────────────────────
const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
const ask   = (q) => new Promise(res => iface.question(q, res));

// ── JSON helpers ─────────────────────────────────────────────────────────────
const readJSON  = (f)    => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');

// ── Ensure dirs exist ─────────────────────────────────────────────────────────
[DATA_DIR, CV_DIR, IMG_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Banner ────────────────────────────────────────────────────────────────────
function banner() {
  console.clear();
  console.log(p(`
  ██████╗  ██████╗ ██╗   ██╗██╗    ██╗ █████╗ ██╗   ██╗
 ██╔═══██╗██╔═══██╗██║   ██║██║    ██║██╔══██╗╚██╗ ██╔╝
 ██║   ██║██║   ██║██║   ██║██║ █╗ ██║███████║ ╚████╔╝ 
 ██║▄▄ ██║██║▄▄ ██║██║   ██║██║███╗██║██╔══██║  ╚██╔╝  
 ╚██████╔╝╚██████╔╝╚██████╔╝╚███╔███╔╝██║  ██║   ██║   
  ╚══▀▀═╝  ╚══▀▀═╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝  `));
  console.log(d('  ─────────────────────────────────────────────────────────'));
  console.log(`  ${b('Portfolio Manager')} ${d('v1.0')}  ${d('— static site edition')}`);
  console.log(d('  ─────────────────────────────────────────────────────────\n'));
}

// ── Separator ─────────────────────────────────────────────────────────────────
const sep = () => console.log(d('  ─────────────────────────────────────────'));

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN MENU
// ─────────────────────────────────────────────────────────────────────────────
async function mainMenu() {
  banner();
  console.log(`  ${b('Main Menu')}\n`);
  console.log(`  ${g('1')}  Manage About Me`);
  console.log(`  ${g('2')}  Manage Projects`);
  console.log(`  ${cy('3')}  Upload / Replace CV`);
  console.log(`  ${cy('4')}  Upload Project Image`);
  console.log(`  ${y('5')}  Build for Production`);
  console.log(`  ${y('6')}  Preview Production Build`);
  console.log(`  ${r('0')}  Exit\n`);

  const choice = (await ask(`  ${d('>')} `)).trim();
  switch (choice) {
    case '1': return aboutMenu();
    case '2': return projectsMenu();
    case '3': return uploadCV();
    case '4': return uploadImage();
    case '5': return buildSite();
    case '6': return previewSite();
    case '0': iface.close(); process.exit(0);
    default:
      console.log(r('\n  Unknown option.\n'));
      await pause();
      return mainMenu();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ABOUT
// ─────────────────────────────────────────────────────────────────────────────
async function aboutMenu() {
  banner();
  const about = readJSON(ABOUT_FILE);
  console.log(`  ${b('About Me')}\n`);
  console.log(`  ${d('Current values:')}\n`);
  console.log(`  ${g('Username')}:        ${about.username}`);
  console.log(`  ${g('Alias')}:           ${about.alias}`);
  console.log(`  ${g('Legal Identity')}: ${about.legal_identity}`);
  console.log(`  ${g('Role')}:            ${about.role}`);
  console.log(`  ${g('Skills')}:          ${about.skills.join(', ')}`);
  console.log(`  ${g('Certifications')}: ${about.certifications.join(', ')}`);
  console.log(`  ${g('CV')}:              ${about.cv_path ?? d('(none)')}\n`);
  sep();
  console.log(`\n  ${g('1')}  Edit fields`);
  console.log(`  ${g('2')}  Edit background text`);
  console.log(`  ${g('3')}  Edit skills list`);
  console.log(`  ${g('4')}  Edit certifications list`);
  console.log(`  ${r('0')}  Back\n`);

  const choice = (await ask(`  ${d('>')} `)).trim();
  switch (choice) {
    case '1': return editAboutFields();
    case '2': return editBackground();
    case '3': return editSkills();
    case '4': return editCerts();
    case '0': return mainMenu();
    default:  return aboutMenu();
  }
}

async function editAboutFields() {
  const about = readJSON(ABOUT_FILE);
  banner();
  console.log(`  ${b('Edit About — press Enter to keep current value')}\n`);

  const fields = ['username', 'alias', 'legal_identity', 'role'];
  for (const f of fields) {
    const val = (await ask(`  ${g(f)} [${d(about[f])}]: `)).trim();
    if (val) about[f] = val;
  }

  writeJSON(ABOUT_FILE, about);
  console.log(g('\n  ✓ Saved.\n'));
  await pause();
  return aboutMenu();
}

async function editBackground() {
  banner();
  const about = readJSON(ABOUT_FILE);
  console.log(`  ${b('Edit Background')}\n`);
  console.log(`  ${d('Current:')}\n`);
  console.log(`  ${about.background.replace(/\n/g, '\n  ')}\n`);
  console.log(d('  Enter new background text. Use \\n for line breaks.'));
  console.log(d('  Press Enter on an empty line when done. Type "keep" to cancel.\n'));

  const lines = [];
  let line;
  while ((line = await ask('  ')) !== '') {
    if (line.toLowerCase() === 'keep') { console.log(d('\n  Cancelled.\n')); await pause(); return aboutMenu(); }
    lines.push(line);
  }
  if (lines.length > 0) {
    about.background = lines.join('\n');
    writeJSON(ABOUT_FILE, about);
    console.log(g('\n  ✓ Saved.\n'));
  }
  await pause();
  return aboutMenu();
}

async function editSkills() {
  banner();
  const about = readJSON(ABOUT_FILE);
  console.log(`  ${b('Edit Skills')}\n`);
  console.log(`  ${d('Current:')} ${about.skills.join(', ')}\n`);
  const input = (await ask(`  Enter comma-separated skills: `)).trim();
  if (input) {
    about.skills = input.split(',').map(s => s.trim()).filter(Boolean);
    writeJSON(ABOUT_FILE, about);
    console.log(g('\n  ✓ Saved.\n'));
  }
  await pause();
  return aboutMenu();
}

async function editCerts() {
  banner();
  const about = readJSON(ABOUT_FILE);
  console.log(`  ${b('Edit Certifications')}\n`);
  console.log(`  ${d('Current:')} ${about.certifications.join(', ')}\n`);
  const input = (await ask(`  Enter comma-separated certifications: `)).trim();
  if (input) {
    about.certifications = input.split(',').map(s => s.trim()).filter(Boolean);
    writeJSON(ABOUT_FILE, about);
    console.log(g('\n  ✓ Saved.\n'));
  }
  await pause();
  return aboutMenu();
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROJECTS
// ─────────────────────────────────────────────────────────────────────────────
async function projectsMenu() {
  banner();
  const projects = readJSON(PROJ_FILE);
  console.log(`  ${b('Projects')} ${d(`(${projects.length} total)`)}\n`);

  projects.forEach((p, i) => {
    console.log(`  ${g(String(i + 1).padStart(2))}  ${b(p.title)}`);
    console.log(`      ${d(p.description?.slice(0, 70) ?? '')}${p.description?.length > 70 ? d('…') : ''}`);
  });

  console.log(`\n  ${cy('n')}  Add new project`);
  console.log(`  ${cy('#')}  Edit project by number`);
  console.log(`  ${r('d#')} Delete project by number ${d('(e.g. d2)')}`);
  console.log(`  ${r('0')}  Back\n`);

  const input = (await ask(`  ${d('>')} `)).trim().toLowerCase();

  if (input === '0') return mainMenu();
  if (input === 'n') return addProject();

  const delMatch = input.match(/^d(\d+)$/);
  if (delMatch) {
    const idx = parseInt(delMatch[1]) - 1;
    if (idx >= 0 && idx < projects.length) {
      const confirm = (await ask(`  ${r('Delete')} "${projects[idx].title}"? (y/N): `)).trim().toLowerCase();
      if (confirm === 'y') {
        projects.splice(idx, 1);
        writeJSON(PROJ_FILE, projects);
        console.log(g('\n  ✓ Deleted.\n'));
      }
    }
    await pause();
    return projectsMenu();
  }

  const num = parseInt(input);
  if (!isNaN(num) && num >= 1 && num <= projects.length) {
    return editProject(num - 1);
  }

  return projectsMenu();
}

async function addProject() {
  banner();
  console.log(`  ${b('Add New Project')}\n`);
  const projects = readJSON(PROJ_FILE);
  const maxId    = projects.reduce((m, p) => Math.max(m, p.id), 0);

  const proj = { id: maxId + 1, title: '', description: '', content: '', images: [], link: '' };

  proj.title       = (await ask(`  Title:             `)).trim();
  proj.description = (await ask(`  Short description: `)).trim();
  proj.link        = (await ask(`  GitHub / URL:      `)).trim();
  console.log(d('  Full content (press Enter on empty line when done):'));
  const lines = [];
  let line;
  while ((line = await ask('  ')) !== '') lines.push(line);
  proj.content = lines.join('\n');

  if (!proj.title) { console.log(r('\n  Title is required. Cancelled.\n')); await pause(); return projectsMenu(); }

  projects.push(proj);
  writeJSON(PROJ_FILE, projects);
  console.log(g(`\n  ✓ Project "${proj.title}" added (id=${proj.id}).\n`));
  await pause();
  return projectsMenu();
}

async function editProject(idx) {
  banner();
  const projects = readJSON(PROJ_FILE);
  const proj     = { ...projects[idx] };
  console.log(`  ${b(`Edit: ${proj.title}`)}\n`);
  console.log(d('  Press Enter to keep current value.\n'));

  const newTitle = (await ask(`  Title       [${d(proj.title)}]: `)).trim();
  if (newTitle) proj.title = newTitle;

  const newDesc = (await ask(`  Description [${d(proj.description?.slice(0,40))}…]: `)).trim();
  if (newDesc) proj.description = newDesc;

  const newLink = (await ask(`  Link        [${d(proj.link)}]: `)).trim();
  if (newLink) proj.link = newLink;

  console.log(d(`  Current images: ${proj.images.join(', ') || '(none)'}`));
  const imgInput = (await ask(`  Images (comma-separated paths, Enter to keep): `)).trim();
  if (imgInput) proj.images = imgInput.split(',').map(s => s.trim()).filter(Boolean);

  console.log(d('  New full content (empty line to finish, "keep" to skip):'));
  const lines = [];
  let line;
  while ((line = await ask('  ')) !== '') {
    if (line.toLowerCase() === 'keep') { lines.length = 0; break; }
    lines.push(line);
  }
  if (lines.length > 0) proj.content = lines.join('\n');

  projects[idx] = proj;
  writeJSON(PROJ_FILE, projects);
  console.log(g('\n  ✓ Saved.\n'));
  await pause();
  return projectsMenu();
}

// ─────────────────────────────────────────────────────────────────────────────
//  FILE UPLOADS
// ─────────────────────────────────────────────────────────────────────────────
async function uploadCV() {
  banner();
  console.log(`  ${b('Upload / Replace CV')}\n`);
  console.log(d(`  CV files are stored in: ${CV_DIR}\n`));

  const src = (await ask(`  ${g('Path to your CV file')} (PDF/DOCX): `)).trim().replace(/^['"]|['"]$/g, '');
  if (!src) { console.log(r('\n  Cancelled.\n')); await pause(); return mainMenu(); }

  if (!fs.existsSync(src)) {
    console.log(r(`\n  File not found: ${src}\n`));
    await pause();
    return mainMenu();
  }

  const ext  = path.extname(src);
  const dest = path.join(CV_DIR, `cv${ext}`);

  // Remove old CVs
  fs.readdirSync(CV_DIR).forEach(f => fs.unlinkSync(path.join(CV_DIR, f)));
  fs.copyFileSync(src, dest);

  // Update about.json cv_path
  const about   = readJSON(ABOUT_FILE);
  about.cv_path = `/uploads/cv/cv${ext}`;
  writeJSON(ABOUT_FILE, about);

  console.log(g(`\n  ✓ CV uploaded → ${dest}`));
  console.log(g(`  ✓ about.json updated (cv_path: ${about.cv_path})\n`));
  await pause();
  return mainMenu();
}

async function uploadImage() {
  banner();
  console.log(`  ${b('Upload Project Image')}\n`);
  console.log(d(`  Images are stored in: ${IMG_DIR}\n`));

  const src = (await ask(`  ${g('Path to image file')}: `)).trim().replace(/^['"]|['"]$/g, '');
  if (!src) { console.log(r('\n  Cancelled.\n')); await pause(); return mainMenu(); }

  if (!fs.existsSync(src)) {
    console.log(r(`\n  File not found: ${src}\n`));
    await pause();
    return mainMenu();
  }

  const base   = path.basename(src);
  const dest   = path.join(IMG_DIR, base);
  const urlPath = `/uploads/images/${base}`;
  fs.copyFileSync(src, dest);
  console.log(g(`\n  ✓ Image copied → ${dest}`));
  console.log(cy(`  URL path: ${urlPath}\n`));

  // Ask if user wants to attach to a project
  const projects = readJSON(PROJ_FILE);
  console.log(`  Attach to a project?`);
  projects.forEach((p, i) => console.log(`  ${g(String(i + 1))}  ${p.title}`));
  console.log(`  ${d('0  Skip')}\n`);

  const choice = parseInt((await ask(`  ${d('>')} `)).trim());
  if (choice >= 1 && choice <= projects.length) {
    projects[choice - 1].images = [...(projects[choice - 1].images ?? []), urlPath];
    writeJSON(PROJ_FILE, projects);
    console.log(g(`\n  ✓ Attached to "${projects[choice - 1].title}".\n`));
  }

  await pause();
  return mainMenu();
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILD & PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
async function buildSite() {
  banner();
  console.log(`  ${b('Building for production…')}\n`);
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
    console.log(g('\n  ✓ Build complete → dist/\n'));
    console.log(d('  Deploy the dist/ folder to Vercel, or run "npm run manage" → Preview.\n'));
  } catch {
    console.log(r('\n  Build failed. Check errors above.\n'));
  }
  await pause();
  return mainMenu();
}

async function previewSite() {
  banner();
  console.log(`  ${b('Starting preview server…')}\n`);
  console.log(d('  Press Ctrl+C to stop.\n'));
  iface.close();
  const child = spawn('npm', ['run', 'preview'], { stdio: 'inherit', cwd: __dirname, shell: true });
  child.on('close', () => process.exit(0));
}

// ─────────────────────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const pause = () => ask(`  ${d('Press Enter to continue…')}`);

// ─────────────────────────────────────────────────────────────────────────────
//  ENTRY
// ─────────────────────────────────────────────────────────────────────────────
mainMenu().catch(err => {
  console.error(r('\nFatal error:'), err);
  process.exit(1);
});
