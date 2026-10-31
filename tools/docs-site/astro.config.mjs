import { defineConfig } from 'astro/config';
import { cpSync, existsSync, createReadStream, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { project, shows } from './src/lib/project.js';

// Folders from the project served under the site's own origin, in dev and in
// the build: design previews always, the built Storybook once code exists (a
// frame on the same origin can size itself, and the site deploys as one
// folder).
const mounts = {
  '/previews': project.paths.previews,
  // The icon files, which the icon dialog reads for its sizes and Copy SVG:
  // inlined, every size of 1,875 icons would treble a 4 MB page.
  '/svg': project.paths.icons,
  // The audit records, as files beside the page rather than baked into it:
  // the published dashboard reads `/audit/<fileKey>.json` when no service
  // answers. Baked, the record was 88% of the audits page and was downloaded
  // and discarded on every load while a service was there to answer.
  '/audit': project.audit,
  ...(shows.stories && { '/storybook': project.storybook.dir }),
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };

const serve = () => ({
  name: 'project-folders',
  hooks: {
    'astro:server:setup': ({ server }) => {
      for (const [at, dir] of Object.entries(mounts)) {
        if (!dir || !existsSync(dir)) continue;
        server.middlewares.use(at, (req, res, next) => {
          const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
          let file = join(dir, rel);
          if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
          if (!existsSync(file)) return next();
          res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
          createReadStream(file).pipe(res);
        });
      }
    },
    'astro:build:done': ({ dir: out }) => {
      for (const [at, dir] of Object.entries(mounts)) {
        // Records only: not the writer's `.prev` copy or a scratch `.tmp`.
        if (dir && existsSync(dir)) cpSync(dir, join(fileURLToPath(out), at), { recursive: true, filter: (src) => !/\.(prev|tmp)$/.test(src) });
      }
    },
  },
});

export default defineConfig({
  // Each project's site is built into that project's own folder, beside
  // its context document and audit record: one place per project. The dashboard
  // service builds into DOCS_OUT and swaps it in, so a rebuild never empties the
  // site being served.
  outDir: process.env.DOCS_OUT || project.site,
  // Its own Vite cache per project: two projects building at once shared one
  // and failed renaming it (ENOTEMPTY).
  cacheDir: join('node_modules', `.vite-${project.id}`),
  // The project's public folder carries its fonts, so specimens render in the
  // faces the product ships. A design-only project has none, and specimens
  // fall back to the system face.
  ...(project.public && { publicDir: project.public }),
  integrations: [serve()],
  vite: { server: { fs: { allow: ['.', project.root] } }, cacheDir: join('node_modules', `.vite-${project.id}`) },
});
