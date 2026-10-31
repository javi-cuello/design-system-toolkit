/*
 * tools/parity/hosts.mjs — how a project's pages are put on screen for the
 * probe, part of the design-to-code parity engine (README.md here; the method
 * is skills/design-code-parity).
 *
 * A host opens a page in a given tier, waits until THIS page has rendered and
 * stopped moving, and refuses one that did not take the tier or the args it
 * was asked for. Which host, and the facts it needs, are the project's: the
 * `parity.host` (and `parity.app`) block of its snapshot.config.json. How a
 * pseudo-state is held is `cdp.forceState`; what is read is `probe.mjs`.
 *
 *   storybook  one story per page: Storybook's own iframe, the tier and the
 *              frame size as globals, the args read back from its store
 *   app        the running product at a route, signed in, the tier as the
 *              colour scheme the browser reports
 *   fragments  many components in one page: each fetched from the site as a
 *              fragment, composed into sections, and served at the site's own
 *              origin so its stylesheets and fonts load as they do on the site
 */
import { navigate, viewport as setViewport, media } from '../shared/cdp.mjs';

/* A tier as every host stamps and reads it: a project names its tiers as it
   likes (`Dark`, `light`), and a page's `data-theme` is lower case. One rule,
   here, so a fragments page stamped `Dark` is not read as matching nothing. */
export const tierName = (tier) => String(tier).toLowerCase();

/* Blank page around each batched section: see `open` in the fragments host. */
const SECTION_GAP = 16;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/*
 * Wait for the page to stop changing, rather than measuring twice and hoping:
 * fonts, then images (an image on a host that never answers fires neither
 * load nor error, so five seconds is the cap), two frames, then the DOM under
 * `root` quiet for 100ms (three seconds at most). A story that re-rendered
 * after the first pass read as "a measurement did not repeat" on ninety
 * variants, then four hundred.
 *
 * Whatever the page focused on its own is blurred, before and after, unless
 * `keepFocus`: a frontmost window draws the ring, so the same story measured a
 * 2px ring in one window and none in another.
 */
export async function settle(tab, { root = 'body', keepFocus = false } = {}) {
  if (!keepFocus) await tab.evaluate('document.activeElement && document.activeElement.blur && document.activeElement.blur(); true').catch(() => {});
  await tab.evaluate(`(async () => {
    await document.fonts.ready;
    /* Only the pictures the browser is loading: a lazy image below its reach
       never starts, so waiting on it is waiting for the 5s cap — twice a
       render, on every screen that opens a page with a long list (51 such
       images on one home page, and the run six times slower for it). Chrome
       starts a lazy image up to 1250px below the fold on a fast connection
       (2500px on a slow one, which a local server never is: with 2500 the
       settle waited its cap on pictures Chrome had not started, and the run
       was 71 s again), so one past that is waited on only once a scroll
       brings it near (the settle after a drive sees it then). A late picture
       that moves a box between the probe's two readings is still a red, not
       a wrong number. */
    const reach = innerHeight + 1250;
    /* Nor a lazy image that is not rendered at all: one inside a closed
       <dialog> or any display:none subtree has no box, Chrome never starts
       it, and its top reads 0 — inside the reach — so every settle waited
       the full cap on a contact sheet's graphic nobody had opened, and a
       site's run went from 20 s to 90 s (one project, 2026-10-13). */
    const loading = (i) => !i.complete && (i.loading !== 'lazy' || (i.getClientRects().length > 0 && i.getBoundingClientRect().top < reach));
    await Promise.race([
      Promise.all([...document.images].filter(loading).map((i) =>
        new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))),
      new Promise((r) => setTimeout(r, 5000)),
    ]);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const root = document.querySelector(${JSON.stringify(root)}) || document.body;
    await new Promise((resolve) => {
      let timer;
      const done = () => { observer.disconnect(); clearTimeout(cap); resolve(); };
      const observer = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(done, 100); });
      observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true });
      timer = setTimeout(done, 100);
      const cap = setTimeout(done, 3000);
    });
    return true;
  })()`);
  /* And again once the page is still: a dialog that opened while it settled
     focused its close button after the first blur, in some runs and not
     others, and two runs measured its ring once and once not. */
  if (!keepFocus) await tab.evaluate('document.activeElement && document.activeElement.blur && document.activeElement.blur(); true').catch(() => {});
}

/* Poll `expression` until true; false when `tries` × 50ms run out, or at once
   when `stop` holds. */
async function until(tab, expression, tries, stop = 'false') {
  for (let i = 0; i < tries; i++) {
    await sleep(50);
    if (await tab.evaluate(expression).catch(() => false)) return true;
    if (await tab.evaluate(stop).catch(() => false)) return false;
  }
  return false;
}

/* What the page was doing when it did not render, so nobody has to guess. */
async function why(tab, url, kind) {
  const state = await tab.evaluate(`document.body.className + ' | ' + document.readyState + ' | ' + decodeURIComponent(location.search) + ' | ' + document.body.innerText.replace(/\\s+/g, ' ').slice(0, 160)`).catch(() => 'no page');
  const trouble = tab.trouble.length ? tab.trouble.slice(0, 6).map((t) => `\n    ${t}`).join('') : '\n    (the browser reported no failed request, exception or console error)';
  return new Error(`${kind} did not render: ${url}\n    page state: ${state}${trouble}`);
}

/* A default as Storybook's table summarises it, written as code ('medium',
   true, 12), read back into the value it names. One that names no value to
   compare (null, undefined, an object, a function, a union) is no default. */
export function declaredValue(s) {
  let v;
  try { v = JSON.parse(String(s).replace(/^'([^']*)'$/, '"$1"')); } catch { return typeof s === 'string' && !/^[{[(]|=>|\|/.test(s) && s !== 'undefined' ? s : undefined; }
  return v === null || typeof v === 'object' ? undefined : v;
}

// an arg left undefined is unset (the component's own default), and one set to null (an option that is no icon) null,
// as Storybook spells them
const argsParam = (args) => Object.entries(args || {})
  .map(([k, v]) => `${k}:${v === undefined ? '!undefined' : v === null ? '!null' : typeof v === 'boolean' ? (v ? '!true' : '!false') : String(v)}`).join(';');

/**
 * Storybook. `base` is where the built Storybook is served; the tier global is
 * `paths.storybook.themeGlobal`, the frame-size global `parity.host.frameGlobal`.
 * A library built elsewhere may stamp no tier and read no frame: with no
 * `themeGlobal` it is opened as it renders, and its one tier is taken as said.
 */
export function storybook({ base, themeGlobal, frameGlobal }) {
  return {
    scope: null,
    base,
    async open(tab, { storyId, args, tier, frame, viewport, keepFocus }) {
      if (viewport) await setViewport(tab, viewport[0], viewport[1]);
      const globals = [themeGlobal && `${themeGlobal}:${tierName(tier)}`, frame && `${frameGlobal}:${frame}`].filter(Boolean).join(';');
      const url = `${base}/iframe.html?id=${storyId}${globals ? `&globals=${globals}` : ''}` +
        (Object.keys(args || {}).length ? `&args=${encodeURIComponent(argsParam(args))}` : '');
      tab.trouble.length = 0;
      await tab.send('Page.navigate', { url });
      /* THIS page, not the previous one: `Page.navigate` returns before the
         new document commits, and two variants of one story differ only in
         args and globals, so all three are compared — one by one, because
         Storybook appends `viewMode=story` once it has loaded. Then its own
         word that the story rendered, `sb-show-main`, rather than the first
         element under the root, which is there before the stylesheet is. A
         story gets fifteen seconds: every variant reloads the preview bundle. */
      const want = Object.fromEntries(['id', 'globals', 'args'].map((k) => [k, new URL(url).searchParams.get(k) ?? '']));
      const here = `(() => { const p = new URLSearchParams(location.search); return ['id', 'globals', 'args'].every((k) => (p.get(k) ?? '') === ${JSON.stringify(want)}[k]); })()`;
      // drawn in the story's root, or beside it in a portal (a modal, a menu): anything on screen but Storybook's own
      const drawn = `(!!document.querySelector('#storybook-root *') || [...document.body.children].some((n) => n.id !== 'storybook-root' && !/^(sb-|storybook-)/.test(n.id || '') && n.tagName !== 'SCRIPT' && n.getBoundingClientRect().height > 0))`;
      if (!await until(tab, `${here} && document.readyState !== 'loading' && document.body.classList.contains('sb-show-main') && ${drawn}`, 300)) throw await why(tab, url, 'story');
      await settle(tab, { root: '#storybook-root', keepFocus });
      /* An explicit stamp, with no default: unstamped means "follow the
         machine", and a run that accepts it measures whichever tier the
         developer's OS is in. */
      const stamped = themeGlobal ? await tab.evaluate(`document.documentElement.getAttribute('data-theme')`) : tierName(tier);
      if (stamped !== tierName(tier)) throw new Error(`tier not applied: asked for ${tierName(tier)}, page says ${stamped === null ? 'nothing (it would follow the machine)' : stamped}`);
      /* Storybook drops a URL arg its story does not declare, silently, and
         renders the default: four components measured `Value=True` with an
         empty field, in green. What it applied is read back. */
      if (args && Object.keys(args).length) {
        const applied = await tab.evaluate(`JSON.stringify((window.__STORYBOOK_STORY_STORE__.args.argsByStoryId || {})[${JSON.stringify(storyId)}] || null)`);
        const got = applied ? JSON.parse(applied) : null;
        if (!got) throw new Error('could not read back the args Storybook applied');
        const missed = Object.entries(args).filter(([k, v]) => String(got[k]) !== String(v) && !(v == null && got[k] == null));
        // a refusal, not a failure to draw: the story did not take what it was given, which the caller reports as such
        if (missed.length) throw Object.assign(new Error(`arg(s) did not reach the story — declare them in the story's argTypes: ${missed.map(([k, v]) => `${k} asked ${JSON.stringify(v)}, got ${JSON.stringify(got[k])}`).join('; ')}`), { refused: true });
      }
    },
    /* The props the story declares, as it declares them: each arg's options, its control, the default
       the component states, and its type and whether it is required as the docgen read them from the
       source, beside the story's own starting args. The one reader of a story's controls.
       A default is Storybook's summary written as code ('medium', true, 12): read back into the value. */
    async api(tab) {
      const got = JSON.parse(await tab.evaluate(`(() => { const st = window.__STORYBOOK_PREVIEW__?.currentRender?.story;
        const valueOf = ${declaredValue.toString()};
        if (!st) return JSON.stringify({ error: document.querySelector('.sb-errordisplay_main')?.textContent?.trim().slice(0, 300) || 'no story is rendered' });
        return JSON.stringify({ args: st.initialArgs, argTypes: Object.fromEntries(Object.entries(st.argTypes).map(([k, v]) => [k, { options: v.options || null, control: v.control && (v.control.type || v.control), default: v.table && v.table.defaultValue ? valueOf(v.table.defaultValue.summary) : undefined, type: v.type ? v.type.name || null : null, summary: (v.table && v.table.type && v.table.type.summary) || (v.type && typeof v.type.value === 'string' ? v.type.value : null), element: [].concat(st.initialArgs[k] ?? []).some((x) => x && typeof x === 'object' && '$$typeof' in x), required: !!(v.type && v.type.required) }])) }); })()`));
      if (got.error) throw new Error(`the story's props could not be read: ${got.error}`);
      return got;
    },
  };
}

/**
 * The running product. `base` is the app's address; `parity.app` gives `shell`
 * (what is on screen once a page has drawn), `login` (where a refused session
 * lands) and `params`: a route token (`:project`) resolved from the app, the
 * first link on `page` whose href matches `pattern`, once per run — a mapping
 * is checked in and an id belongs to whichever database this machine has.
 *
 * `prefix` is for an app that carries its tenant in the address
 * (/acme/london/projects): where `page` lands, matched against `pattern`, is
 * the prefix every route is opened under — read once per run, for the same
 * reason a token is — except the routes in `except` (a sign-in page has no
 * tenant). A mapping keeps naming `/projects`; the tenant is the database's.
 * Links are matched against `params` with the prefix taken off.
 */
export function app({ base, shell, login, params = {}, prefix }) {
  const resolved = {}, resolving = {};
  let placed = null, placing = null;
  const tenant = async (tab) => {
    placing ??= (async () => {
      await tab.send('Page.navigate', { url: `${base}${prefix.page}` });
      for (let i = 0; i < 400 && placed === null; i++) {
        await sleep(50);
        placed = await tab.evaluate(`location.pathname.match(new RegExp(${JSON.stringify(prefix.pattern)}))?.[1] ?? null`).catch(() => null);
      }
      if (placed === null) throw new Error(`${prefix.page} in the running app did not land on an address matching ${prefix.pattern}`);
    })();
    await placing;
    return placed;
  };
  const under = (path) => prefix && !(prefix.except || []).some((e) => path === e || path.startsWith(`${e}/`) || path.startsWith(`${e}?`));
  const route = async (tab, path) => {
    const pre = under(path) ? await tenant(tab) : '';
    for (const [token, { page, pattern }] of Object.entries(params)) {
      if (!path.includes(token)) continue;
      if (!resolved[token]) {
        resolving[token] ??= (async () => {
          await tab.send('Page.navigate', { url: `${base}${pre}${page}` });
          for (let i = 0; i < 400 && !resolved[token]; i++) {
            await sleep(50);
            resolved[token] = await tab.evaluate(`(() => { const pre = ${JSON.stringify(pre)}; const m = [...document.querySelectorAll('a[href]')].map((x) => { const h = x.getAttribute('href'); return (pre && h.startsWith(pre + '/') ? h.slice(pre.length) : h).match(new RegExp(${JSON.stringify(pattern)})); }).find(Boolean); return m ? m[1] : null; })()`).catch(() => null);
          }
          if (!resolved[token]) throw new Error(`nothing on ${page} in the running app to resolve ${token} against`);
        })();
        await resolving[token];
      }
      path = path.replace(token, resolved[token]);
    }
    return pre + path;
  };
  return {
    scope: null,
    async open(tab, { route: wanted, tier, viewport, keepFocus }) {
      if (viewport) await setViewport(tab, viewport[0], viewport[1]);
      await media(tab, { 'prefers-color-scheme': tierName(tier) });
      const path = await route(tab, wanted);
      const url = `${base}${path}`;
      tab.trouble.length = 0;
      await tab.send('Page.navigate', { url });
      /* A server render over a real database: thirty seconds. */
      /* The address with its query: `/?q=…` is a different page from `/`.
         Landing on the login page means a refused session only where the
         route asked is another page: the login frame's own route stopped at
         the first poll, before its document had loaded, in some runs. */
      const refused = login && path.split('?')[0] !== login ? login : null;
      if (!await until(tab, `location.pathname + location.search === ${JSON.stringify(path)} && document.readyState !== 'loading' && !!document.querySelector(${JSON.stringify(shell)})`, 600,
        refused ? `location.pathname === ${JSON.stringify(refused)}` : 'false')) {
        if (refused && await tab.evaluate('location.pathname').catch(() => '') === refused) throw new Error(`the app sent ${path} to ${login} — the session cookie was refused`);
        throw await why(tab, url, 'route');
      }
      await settle(tab, { root: shell, keepFocus });
      /* The scheme is emulated, so reading it back says nothing about the
         page: an app themed by a stamp (`data-theme`, from a cookie or its
         own default) measured one tier twice and reported two green (item 25
         of the 2026-10-02 review). A page that stamps a tier must stamp this
         one; a page that stamps none follows the scheme the run set. */
      const stamped = await tab.evaluate(`document.documentElement.getAttribute('data-theme')`);
      if (stamped !== null && stamped !== tierName(tier)) throw new Error(`tier not applied: asked for ${tierName(tier)}, the page stamps data-theme="${stamped}" whatever the colour scheme`);
    },
  };
}

/**
 * A site's own component fragments, many to a page. `base` is the site; the
 * fragment for a component is `url` with `{component}` filled and the args as
 * its query; `stylesheets` are linked by URL. The page is served at
 * `<base>/__parity/<n>`, so nothing is inlined or rewritten. The tier is
 * stamped on <html> as `data-theme` and read back.
 */
export function fragments({ base, url, stylesheets = [] }) {
  let n = 0;
  return {
    scope: (key) => `[data-parity="${key}"]`,
    async fragment(component, args = {}) {
      const query = new URLSearchParams(Object.entries(args).map(([k, v]) => [k, v === true ? '1' : String(v)]));
      const at = `${base}${url.replace('{component}', component)}`;
      const res = await fetch(`${at}${at.includes('?') ? '&' : '?'}${query}`.replace(/[?&]$/, ''));
      if (!res.ok) throw new Error(`${at}: ${res.status}`);
      return res.text();
    },
    // sections: [{ key, html, width }] — a width in px, or none to hug. Each
    // sits in SECTION_GAP of its own so a ring or an outer shadow drawn past a
    // component's box lands on blank page, not on its neighbour.
    async open(tab, sections, { tier: asked, viewport }) {
      const tier = tierName(asked);
      const body = sections.map((s) => `<section data-parity="${s.key}" style="box-sizing:content-box;padding:${SECTION_GAP}px;display:flow-root;inline-size:${s.width ? `${s.width}px` : 'max-content'}">${s.html}</section>`).join('\n');
      const html = `<!doctype html><html data-theme="${tier}"><head><meta charset="utf-8">${stylesheets.map((h) => `<link rel="stylesheet" href="${h}">`).join('')}</head><body style="margin:0">${body}</body></html>`;
      await setViewport(tab, viewport[0], viewport[1]);
      await navigate(tab, `${base}/__parity/${++n}`, { html, timeout: 40_000 });
      await settle(tab);
      const stamped = await tab.evaluate(`document.documentElement.getAttribute('data-theme')`);
      if (stamped !== tier) throw new Error(`tier not applied: asked for ${tier}, the page rendered ${stamped}`);
    },
  };
}

/*
 * A page driven into the state its frame draws, as a person would get it
 * there and with the page's own scripts reacting: what was typed (`fill`,
 * selector → value), then what was pressed (`click`, one selector or several
 * in order, by script; `hover` and `press`, by the real pointer), then where it was scrolled to (`scroll`, px or 'end'; the window,
 * or the box that scrolls `scroller` where the page keeps its content in a
 * panel). A selector
 * that matches nothing is refused: a click that never happened measures the
 * rest state and passes. Focus is the run's (`cdp.forceState`), as a
 * component's is.
 */
export async function drive(tab, { fill, click, hover, press, scroll, scroller } = {}) {
  const run = async (expr) => {
    const missed = await tab.evaluate(expr);
    if (missed) throw new Error(`the page state's selector matched nothing: ${missed}`);
  };
  for (const [selector, value] of Object.entries(fill || {})) {
    await run(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return ${JSON.stringify(selector)}; el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event('input', { bubbles: true })); return null; })()`);
  }
  for (const selector of click === undefined ? [] : [].concat(click)) {
    await run(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return ${JSON.stringify(selector)}; el.click(); return null; })()`);
    await sleep(150);
  }
  /* A pointer over an element (`hover`), or pressed on it (`press`), as real input: what a script's
     click cannot reach, a tooltip opened by the pointer or a menu that listens for the press. */
  const point = async (selector) => {
    const p = await tab.evaluate(`(() => { const n = document.querySelector(${JSON.stringify(selector)}); if (!n) return null; const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    if (!p) throw new Error(`the page state's selector matched nothing: ${selector}`);
    await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1] });
    return p;
  };
  for (const selector of hover === undefined ? [] : [].concat(hover)) { await point(selector); await sleep(150); }
  for (const selector of press === undefined ? [] : [].concat(press)) {
    const [x, y] = await point(selector);
    for (const type of ['mousePressed', 'mouseReleased']) await tab.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    await sleep(150);
  }
  if (scroll !== undefined) {
    /* The window, or the box that scrolls where the page keeps its content in
       a panel: `scroller` and the nearest ancestor of it that can scroll. */
    await tab.evaluate(`(() => {
      let box = ${JSON.stringify(scroller || null)} && document.querySelector(${JSON.stringify(scroller || '')});
      while (box && !(/auto|scroll/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight)) box = box.parentElement;
      const to = ${scroll === 'end' ? '(box || document.documentElement).scrollHeight' : Number(scroll)};
      if (box) { box.scrollTop = to; box.dispatchEvent(new Event('scroll')); } else { scrollTo(0, to); dispatchEvent(new Event('scroll')); }
      return true;
    })()`);
    await sleep(150);
  }
  if (fill || click !== undefined || hover !== undefined || press !== undefined || scroll !== undefined) await settle(tab, { keepFocus: true });
}

/** The host a project's `parity.host.kind` names, given its facts. */
export function host(kind, facts) {
  const make = { storybook, app, fragments }[kind];
  if (!make) throw new Error(`parity: no host "${kind}" (storybook, app, fragments)`);
  return make(facts);
}
