// Baut den Ordner www/ für die App: Web-Dateien kopieren, Schriften und Bibliotheken lokal einbinden
import fs from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const SRC = process.env.FORMWERK_SRC || path.resolve(here, "..");
const OUT = path.join(here, "www");
const NM = path.join(here, "node_modules");

const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(from, to, { recursive: true }); };
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 1. Web-Dateien
const files = fs.readdirSync(SRC).filter(f => /\.(html|js|webmanifest)$/.test(f) && f !== "sw.js");
for (const f of files) copy(path.join(SRC, f), path.join(OUT, f));
for (const d of ["icons", "img"]) if (fs.existsSync(path.join(SRC, d))) copy(path.join(SRC, d), path.join(OUT, d));

let html = fs.readFileSync(path.join(OUT, "index.html"), "utf8");
const warn = [];

// 2. Bibliotheken lokal statt aus dem Internet
const libs = [
  ["https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js", "@zxing/library/umd/index.min.js", "vendor/zxing.min.js"],
  ["https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js", "firebase/firebase-app-compat.js", "vendor/firebase-app-compat.js"],
  ["https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js", "firebase/firebase-firestore-compat.js", "vendor/firebase-firestore-compat.js"]
];
for (const [url, mod, local] of libs) {
  const src = path.join(NM, mod);
  if (fs.existsSync(src) && html.includes(url)) { copy(src, path.join(OUT, local)); html = html.replace(url, local); }
  else warn.push("Bibliothek bleibt online: " + url);
}

// 3. Schriften lokal
const fonts = [["figtree", "Figtree", [400, 500, 600, 700]], ["barlow-condensed", "Barlow Condensed", [500, 600, 700]]];
let css = "";
let fontsOk = true;
for (const [pkg, family, weights] of fonts) for (const w of weights) {
  const file = `${pkg}-latin-${w}-normal.woff2`, src = path.join(NM, "@fontsource", pkg, "files", file);
  if (!fs.existsSync(src)) { fontsOk = false; continue; }
  copy(src, path.join(OUT, "fonts", file));
  css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(${file}) format("woff2")}\n`;
}
if (fontsOk) {
  fs.writeFileSync(path.join(OUT, "fonts", "fonts.css"), css);
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/, "")
             .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">/, '<link rel="stylesheet" href="fonts/fonts.css">');
} else warn.push("Schriften bleiben online (Google Fonts)");

fs.writeFileSync(path.join(OUT, "index.html"), html);
console.log(`www/ erstellt: ${files.length} Dateien, Fotos und Icons kopiert.`);
for (const w of warn) console.log("Hinweis: " + w);
