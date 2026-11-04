// How this project builds a screen: the recipe tools/snapshot/recipes.cjs
// derives from its stored screens (shells, repeated regions and slots with
// their spacing tokens, what varies, each screen type's states). Derived at
// build, so the next snapshot changes it; none where nothing is stored.
import { project } from '../../lib/project.js';
import storeTool from '../../../../snapshot/store.cjs';
import recipes from '../../../../snapshot/recipes.cjs';
import { json } from './_shared.js';

export function GET() {
  const screens = storeTool.readScreens(project.paths.screens);
  return json(screens.length ? recipes.derive(screens) : { screens: 0 });
}
