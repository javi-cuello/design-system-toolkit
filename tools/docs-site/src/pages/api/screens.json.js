// How this project builds a screen: the recipe tools/snapshot/recipes.cjs
// derives from its stored screens (shells, repeated regions and slots with
// their spacing tokens, what varies, each screen type's states). Derived at
// build, so the next snapshot changes it; none where nothing is stored.
// Each screen template is paired with the code file the project's
// snapshot.config.json `templates` names for it.
import fs from 'node:fs';
import path from 'node:path';
import { project } from '../../lib/project.js';
import repoConfig from '../../../../shared/repo-config.cjs';
import storeTool from '../../../../snapshot/store.cjs';
import recipes from '../../../../snapshot/recipes.cjs';
import { json } from './_shared.js';

export function GET() {
  const screens = storeTool.readScreens(project.paths.screens);
  // a design-only project has no repo, and so no code to pair
  const read = project.repo ? repoConfig.readRepoConfig(project.repo) : { config: {} };
  // a config that cannot be read pairs nothing, and the build says why rather than publishing every code as none
  if (read.error) console.warn(`api/screens.json: ${read.error}; screen templates are published unpaired`);
  const exists = project.repo ? (f) => fs.existsSync(path.join(project.repo, f)) : null;
  return json(screens.length ? recipes.derive(screens, { code: (read.config || {}).templates || {}, exists }) : { screens: 0 });
}
