'use strict';
/*
 * A repo's snapshot.config.json, read one way by every tool that needs it.
 *
 * Seven commands read it with a bare readFileSync, so a repo without one, or a
 * folder named by mistake, met an ENOENT stack, and a file with a stray comma
 * was reported by projects.cjs as missing. Here the two are told apart and each
 * said in a sentence: `readRepoConfig` returns `{ config }` or `{ error }` for a
 * caller that goes on (projects.cjs locate), `repoConfig` says the error under
 * the tool's name and exits 2 for a command that cannot.
 */
const fs = require('fs');
const path = require('path');

const FILE = 'snapshot.config.json';

function readRepoConfig(repo) {
  const file = path.join(repo, FILE);
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { missing: true, file, error: `no ${FILE} in ${repo}: a project repo carries one, and node tools/project-check/init.mjs in it writes one` };
    return { file, error: `${file} cannot be read: ${e.message}` };
  }
  let config;
  try { config = JSON.parse(text); } catch (e) { return { file, error: `${file} is not valid JSON: ${e.message}` }; }
  if (!config || typeof config !== 'object' || Array.isArray(config)) return { file, error: `${file} is not a JSON object` };
  return { file, config };
}

function repoConfig(repo, tool) {
  const r = readRepoConfig(repo);
  if (r.error) { console.error(`${tool}: ${r.error}`); process.exit(2); }
  return r.config;
}

module.exports = { FILE, readRepoConfig, repoConfig };
