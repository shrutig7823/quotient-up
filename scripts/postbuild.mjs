// After `expo export`, make the static site work on common free hosts:
//  1. Several hosts (Vercel, Netlify and others) silently drop any folder named "node_modules", and Expo puts
//     font files in dist/assets/node_modules/... . Rename it to "vendor" and rewrite every reference.
//  2. 404.html = index.html, so GitHub Pages serves the app for deep links like /genre/quant.
import { copyFileSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
if (!existsSync(join(dist, 'index.html'))) throw new Error('dist/index.html not found. Run the export first.');

// 1. node_modules -> vendor
const from = join(dist, 'assets', 'node_modules');
if (existsSync(from)) {
  renameSync(from, join(dist, 'assets', 'vendor'));
  let files = 0;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(js|html|css|json|map)$/.test(name)) {
        const text = readFileSync(p, 'utf8');
        if (text.includes('assets/node_modules/')) {
          writeFileSync(p, text.split('assets/node_modules/').join('assets/vendor/'));
          files++;
        }
      }
    }
  };
  walk(dist);
  console.log(`postbuild: renamed assets/node_modules -> assets/vendor (${files} files updated)`);
}

// 2. SPA fallback for GitHub Pages
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
console.log('postbuild: dist/404.html written');
