// @runs: the audit dashboard's Audit (tools/figma-audit/server.mjs serves it at /scripts), as well as a session.
// Foundations scanner — the file as a whole, not its components one by one.
//
// Runs as a figma_execute body. The caller prepends `const TOKENS`: the
// library's `tokens` from the project's `audit-settings` block, with the house
// `audit-defaults` beneath it. Every check reads its rule from TOKENS, and a
// key that is absent skips its check rather than borrowing a value: a borrowed
// convention reports another project's answer as this project's defect.
//
// Returns { audited: [{ set, id, page, candidates }], fileKey, fileName } — the
// components scanner's shape, so the same queue files both. File-level
// findings name "Page list" as their set.
//
// Facts are gathered first and judged by checkFacts(), a pure function, so the
// checks run in node against fixture facts with no Figma at all: run this body
// with no `figma` in scope and it returns checkFacts itself.

// The page marker compiles as Unicode, so `\p{L}` keeps "États" whole; a
// pattern the u flag refuses compiles as written.
function markerRe(src) {
  try { return new RegExp(src, "u"); } catch (e) { return new RegExp(src); }
}

function checkFacts(facts, T) {
  T = T || {};
  const out = [];
  // Which checks were able to run. A check gated on a setting the project's
  // context document does not carry is not a clean check, it is an absent one.
  const ran = [];
  /*
   * `text` is the state — what is true of the file. `advice` is the
   * instruction — what to do about it. They are two fields because the board
   * puts them in two columns, and a finding that states only the state leaves
   * the reader to invent the fix.
   *
   * `advice` was added to the callers and NOT to this signature, so it was
   * the seventh argument to a function of six and every one was dropped on
   * the floor. Nothing failed: the candidates were well formed, the rows
   * filed, and the board rendered its fallback — "Decide how to handle it." —
   * on every foundations row for four versions, while the skill said in
   * writing that every check emitted advice. An argument a function does not
   * name is the quietest way to lose a value in JavaScript, which is why the
   * suite now asserts the field rather than the wording.
   */
  // `key` is what the finding is about — rule and subject, never wording —
  // so the row writer finds the same row after a check is reworded.
  const push = (set, id, page, sev, rule, text, advice, key) => {
    // One entry per set and page: file-level findings all name "Page list",
    // and sharing one entry credited every section's finding to the first.
    let e = out.find((x) => x.set === set && x.id === id && x.page === page);
    if (!e) { e = { set, id, page, variants: 0, axes: [], described: true, candidates: [] }; out.push(e); }
    e.candidates.push({ sev, rule, text, advice, key });
  };
  const marker = T.pageMarker ? markerRe(T.pageMarker) : null;
  const bare = (name) => (marker ? name.replace(marker, "") : name).trim();
  // localeCompare, never `<`: code-point order sorts every capital before every
  // lowercase letter and puts accented names last.
  const cmp = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
  // Divider pages, from the recorded pattern; without one no page is a divider.
  const DIV = T.dividerPage ? new RegExp(T.dividerPage) : null;
  const divider = (name) => !!DIV && DIV.test(name);

  // ---- The component-page template (figma-standard rule 15) ----------------------
  // Each page's section cards, in canvas order, against the recorded sequence:
  // in order, and the matrix present exactly when the page's primary component
  // has variant axes or booleans. A building-block page (every component on it
  // private, or used inside another) is exempt, as the rule says.
  if (T.pageSections && T.pageSectionComponent && facts.templates) {
    ran.push(facts.templates.length ? "page-template" : "page-template:n/a");
    const seq = T.pageSections;
    for (const t of facts.templates) {
      if (t.blocks) continue;
      if (!t.sections.length) {
        push("Page list", null, t.page, "warning", "page-template", `${t.page} has none of the template's sections (${seq.join(" · ")}), so a reader finds nothing where every other page puts it`, `Add the sections as ${T.pageSectionComponent} cards, or record the page as a building block.`, "page-template|missing|" + t.page);
        continue;
      }
      const at = t.sections.map((x) => seq.indexOf(x));
      if (at.some((x, i) => i && x < at[i - 1]))
        push("Page list", null, t.page, "warning", "page-template", `${t.page}'s sections run ${t.sections.join(" · ")}, out of the template's order ${seq.filter((x) => t.sections.includes(x)).join(" · ")}, so a reader looks for a section where it is not`, "Move the section cards into the template's order.", "page-template|order|" + t.page);
      if (T.matrixSection && t.sections.includes(T.matrixSection) !== t.primaryAxes)
        push("Page list", null, t.page, "warning", "page-template", t.primaryAxes ? `${t.page} has no ${T.matrixSection} though its primary component has variant axes or booleans, so nobody can see every combination side by side` : `${t.page} has a ${T.matrixSection}, but its primary component has nothing to permute, so the section repeats a single item`, t.primaryAxes ? `Generate the ${T.matrixSection} for it.` : `Remove the ${T.matrixSection}.`, "page-template|matrix|" + t.page);
    }
  }

  // ---- Page and category order (figma-standard rule 11) --------------------------
  // Needs the project's header pattern. Pages before the first header (a
  // cover, notes) belong to no category and are not ordered; dividers are
  // furniture. A pinned-last category must follow every other one and is left
  // out of the alphabetical comparison.
  if (T.sectionHeader) {
    ran.push("page-order");
    const H = new RegExp(T.sectionHeader);
    const pinned = new Set(T.pinnedLast || []);
    const skip = new Set(T.excludeSections || []);
    const sections = [];
    let cur = null;
    for (const p of facts.pages) {
      if (H.test(p.name)) { cur = { header: p.name, name: bare(p.name), members: [] }; sections.push(cur); continue; }
      if (!cur || divider(p.name)) continue;
      cur.members.push(p.name);
    }
    const free = sections.filter((s) => !pinned.has(s.header));
    for (let i = 1; i < free.length; i++) {
      if (cmp(free[i - 1].name, free[i].name) <= 0) continue;
      // The destination, not the neighbour — the same fix the page loop 25
      // lines below carries, which this one did not get because no project's
      // section list is out of order, so nothing caught it. A category three
      // places late otherwise reports one hop at a time, and a maintainer who
      // follows the advice exactly sees it raised again on the next run.
      const dest = free.slice(0, i).map((x) => x.name).find((m) => cmp(free[i].name, m) < 0) || free[i - 1].name;
      push("Page list", "", free[i].header, "warning", "page-order",
          "Category " + free[i].name + " comes after " + dest + ", out of alphabetical order, so readers and everything presenting the file in page order look for it in the wrong place",
          "In Figma: drag the " + free[i].name + " section above " + dest + " in the page list.",
          "page-order|category|" + free[i].name);
    }
    // The pinned categories themselves run in the recorded order.
    const pinOrder = (T.pinnedLast || []).filter((h) => sections.some((s) => s.header === h));
    const pinSeen = sections.filter((s) => pinned.has(s.header)).map((s) => s.header);
    for (let i = 1; i < pinSeen.length; i++) if (pinOrder.indexOf(pinSeen[i]) < pinOrder.indexOf(pinSeen[i - 1]))
      push("Page list", "", pinSeen[i], "warning", "page-order", "Category " + bare(pinSeen[i]) + " comes before " + bare(pinSeen[i - 1]) + " among the categories kept last, out of their recorded order, so readers look for it in the wrong place",
        "In Figma: move " + bare(pinSeen[i]) + " below " + bare(pinSeen[i - 1]) + ".", "page-order|pinned|" + pinSeen[i]);
    let pinnedSeen = null;
    for (const s of sections) {
      if (pinned.has(s.header)) pinnedSeen = s.name;
      else if (pinnedSeen) push("Page list", "", s.header, "warning", "page-order",
        "Category " + s.name + " comes after " + pinnedSeen + ", which the project pins last, so it reads as pinned too",
        "In Figma: move " + s.name + " above " + pinnedSeen + " in the page list.",
          "page-order|category|" + s.name);
    }
    for (const s of sections) {
      if (skip.has(s.header)) continue;            // outside the audit, by the project's ruling
      for (let i = 1; i < s.members.length; i++) {
        const a = bare(s.members[i - 1]), b = bare(s.members[i]);
        if (cmp(a, b) <= 0) continue;
        // Name where the page actually belongs — the first earlier page it
        // sorts before — not merely the neighbour it is behind. A page three
        // places out of position reports one hop at a time otherwise, so a
        // maintainer who follows the advice exactly moves it once and the
        // check raises again on the next run.
        const dest = s.members.slice(0, i).map(bare).find((m) => cmp(b, m) < 0) || a;
        push("Page list", "", s.header, "warning", "page-order",
          "In " + s.name + ", " + b + " comes after " + dest + ", out of alphabetical order, so a reader hunts for it",
          "In Figma: drag the " + b + " page above " + dest + " inside " + s.name + ".",
          "page-order|page|" + s.name + "|" + b);
      }
    }
  }

  const live = facts.components.filter((c) => c.inScope !== false);

  // ---- In-progress pages and their components (figma-standard rule 13) ----------
  // A component on a page marked in progress carries the marker too, and one on a
  // finished page does not. The marker may sit after the private prefix.
  if (T.statusMarker) {
    ran.push("status-marker");
    const M = T.statusMarker, P = T.internalPrefix || "";
    const n0 = (n) => n.startsWith(M) ? n.slice(M.length).trimStart() : n;
    const marked = (n) => n.startsWith(M) || (P && n.startsWith(P + M));
    for (const c of facts.components) {
      if (c.inScope === false) continue;
      const wip = c.page.trim().startsWith(M);
      // A private part keeps `_` first: Figma publishes a name that does not start with it.
      if (P && n0(c.name).startsWith(P) && c.name.startsWith(M)) push(c.name, c.id, c.page, "error", "naming", `${c.name} puts ${M} before ${P}, so Figma publishes this private part`, `Rename it ${P}${M} ${n0(c.name).slice(P.length).trimStart()}.`, "status-marker|publishes|" + c.name);
      if (wip && !marked(c.name)) push(c.name, c.id, c.page, "warning", "naming", `${c.name} sits on an in-progress page and does not carry ${M}, so people placing it take it for finished`, `Rename it ${M} ${c.name}, or finish the page.`, "status-marker|missing|" + c.name);
      if (!wip && marked(c.name)) push(c.name, c.id, c.page, "warning", "naming", `${c.name} carries ${M} on a page that is not in progress, so people avoid a component that may be finished`, `Drop ${M} from the name, or mark the page in progress.`, "status-marker|stale|" + c.name);
    }
  }

  // ---- Names that differ only in case (figma-standard rule 19) --------------------
  // A fixed rule: every export path lowercases, so the pair collapses into one.
  const byLower = {};
  for (const c of live) (byLower[c.name.toLowerCase()] = byLower[c.name.toLowerCase()] || []).push(c);
  for (const list of Object.values(byLower)) {
    const names = [...new Set(list.map((c) => c.name))];
    if (names.length > 1) push(list[0].name, list[0].id, list[0].page, "warning", "naming",
      "two components differ only in case: " + names.join(" · "),
      "Rename one of them so they differ by more than a capital — every export path lowercases, " +
      "so the two collapse into one file and whichever is written second wins");
  }

  // ---- Grouped names use the recorded separator (figma-standard rule 20) -----------
  // A slash that is not the recorded separator is either a typo for it or a
  // name that means something else by "/"; both want a reader, not a rename.
  /*
   * This check is about a BARE slash where the project's separator contains
   * one, so a project that groups with `.` or `_` has nothing here to check —
   * which is different from a project that recorded no separator at all.
   * Reported as "did not apply" rather than "not run": the run used to say
   * "the context document does not carry the setting each needs", which is
   * false of a project that carries it and simply does not group with a slash.
   */
  if (T.groupSeparator && !T.groupSeparator.includes("/")) ran.push("separator:n/a");
  if (T.groupSeparator && T.groupSeparator.includes("/")) {
    ran.push("separator");
    for (const c of live) {
      if (!c.name.includes("/")) continue;
      if (c.name.split(T.groupSeparator).join("").includes("/"))
        push(c.name, c.id, c.page, "preference", "naming",
          "Grouped with a bare \"/\" where this project writes \"" + T.groupSeparator + "\", so Figma files the component in a folder nobody intended",
          "Put the spaces back (\"" + T.groupSeparator + "\") so it groups with the rest, or record what the slash means here.",
          "naming|separator");
    }
  }

  // ---- A part carries its parent's name (figma-standard rule 9) ------------------
  // A part is a component used inside exactly one parent. Members of one
  // grouped set count as one parent. The rule binds parts, never a public
  // component that happens to be composed somewhere: a public component with
  // a page of its own is a component, so only private parts and public parts
  // living on their parent's page are checked. A part used by two or more
  // parents keeps a functional name and is exempt.
  if (T.familySeparator) {
    ran.push("parent-name");
    const priv = T.internalPrefix || null;
    // The group separator with or without its spaces, so a bare one still groups.
    const GS = T.groupSeparator && T.groupSeparator.trim() ? new RegExp("\\s*" + T.groupSeparator.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*") : null;
    const stem = (n) => GS ? n.split(GS)[0].trim() : n.trim();
    // A leading status marker (`🚧 _Card - Header`) is a status, not part of the
    // name, so names are compared without it (figma-standard rule 13); left on, it hid the
    // privacy mark and every 🚧 part read as not carrying its parent's name.
    const unmarked = (n) => { const at = T.statusMarker ? n.indexOf(T.statusMarker) : -1; return at >= 0 && !/[\p{L}\p{N}]/u.test(n.slice(0, at)) ? n.slice(0, at) + n.slice(at + T.statusMarker.length).trimStart() : n; };
    const plain = (n) => { const b = unmarked(n); return priv && b.startsWith(priv) ? b.slice(priv.length) : b; };
    // Each page's category, read from the page list the way the page-order check
    // reads it; null where the project records no section header.
    const catOfPage = new Map();
    if (T.sectionHeader) {
      const H = new RegExp(T.sectionHeader); let cat = null;
      for (const p of facts.pages) { if (H.test(p.name)) { cat = bare(p.name); continue; } if (!divider(p.name)) catOfPage.set(p.name, cat); }
    }
    const catOf = (page) => catOfPage.get(page) || null;
    // Plain names of every component, and the categories named after a family in
    // them: `TABLES` holds `Table`, so its members may drop the family word.
    const names = new Set(facts.components.map((x) => plain(stem(x.name))));
    // A category is a family's when its name is that family's plural, read from
    // the data; `familyCategories` adds the ones the data cannot pair (an
    // irregular plural, another language).
    const familyCats = new Set(T.familyCategories || []);
    for (const x of facts.components) { const cat = catOf(x.page); if (cat && cat.toLowerCase().replace(/s$/, "") === plain(stem(x.name)).toLowerCase()) familyCats.add(cat); }
    for (const c of live) {
      const parents = [...new Set((c.parents || []).map(stem))];
      if (parents.length !== 1) continue;
      const parent = parents[0];
      const parentPage = (facts.components.find((x) => stem(x.name) === parent) || {}).page;
      const isPart = (priv && unmarked(c.name).startsWith(priv)) || (parentPage && parentPage === c.page);
      if (!isPart) continue;
      // Already carries it, two ways: prefixed (`_Avatar - Colour`) or by
      // being the parent's name with the privacy mark (`_Dialog` inside
      // `Dialog`). The second was flagged, and the rename it proposed was
      // `_Dialog - Dialog` — the part carries its parent's name already, which
      // is the whole of what figma-standard rule 9 asks for. Found on a real library's first
      // foundations run, on 2 of 61 hits.
      if (plain(c.name) === plain(parent)) continue;
      // A family with a category of its own (`🔷 TABLES` holding `Table`) names
      // its members without the family word, which the category supplies
      // (figma-standard rule 9): `Cell / Fill` on a TABLES page carries its family.
      if (familyCats.has(catOf(c.page))) continue;
      // The family is the component the page documents, which may be any leading
      // run of the parent's words that is itself a component: `List item` inside
      // `List group` belongs to `List` (figma-standard rule 9, middle levels dropped).
      const pw = plain(stem(parent)).split(T.familySeparator);
      let carried = false;
      for (let k = pw.length; k >= 1 && !carried; k--) {
        const fam = pw.slice(0, k).join(T.familySeparator);
        if (k < pw.length && !names.has(fam)) continue;
        if (plain(c.name).startsWith(fam + T.familySeparator) || (T.groupSeparator && plain(c.name).startsWith(fam + T.groupSeparator))) carried = true;
      }
      if (carried) continue;
      // Either separator. A slash group extends its parent's name with the
      // GROUP separator — `_File explorer - Section / L2` inside
      // `_File explorer - Section / L1` — and accepting only the family one
      // told a component that literally starts with its parent's full name
      // that it does not carry it, offering `… - Section / L2`. Its siblings
      // under ` - ` were silent, which is what proved the separator decided it.
      if (plain(c.name).startsWith(plain(parent) + T.familySeparator)) continue;
      if (T.groupSeparator && plain(c.name).startsWith(plain(parent) + T.groupSeparator)) continue;
      /*
       * The leaf is what the child adds to its parent, not the child's whole
       * name. Both share a family more often than not — a part of
       * `Table - Column` is usually called `Table - something` — and pasting
       * the two together proposed `Table - Column - Table - Header / Fill`
       * and `Sidebar (Secondary) - Section - Sidebar (Secondary) - Item`.
       * The finding was right and the rename was unusable, which is worse
       * than no rename: it reads as the answer and it is nonsense.
       *
       * So drop the segments the two already share from the front, and if
       * nothing is left the child is a prefix of its parent and carries the
       * name by any reading — no finding.
       */
      const segs = (n) => plain(n).split(T.familySeparator);
      const pSeg = segs(parent), cSeg = segs(c.name);
      let shared = 0;
      while (shared < pSeg.length && shared < cSeg.length && pSeg[shared] === cSeg[shared]) shared++;
      const leaf = cSeg.slice(shared).join(T.familySeparator);
      if (!leaf) continue;
      // The name figma-standard rule 9 asks for: the family (the component the page documents,
      // else the parent) and the part's own last word, sentence case when the
      // family joins with a space, keeping a ` / ` sibling's suffix.
      const doc = facts.components.find((x) => x.page === c.page && plain(stem(x.name)) === bare(c.page));
      const fam = doc ? plain(stem(doc.name)) : plain(stem(parent));
      let last = stem(leaf).split(/\s+/).pop();
      if (!T.familySeparator.trim() && last !== last.toUpperCase()) last = last.toLowerCase();
      push(c.name, c.id, c.page, "preference", "naming",
        "Used only inside " + parent + " but does not carry its name, so it sorts away from " + parent + " and reads as a component anyone may place",
        "In Figma: rename it to \"" + (priv && unmarked(c.name).startsWith(priv) ? priv : "") + fam + T.familySeparator + last + leaf.slice(stem(leaf).length) +
        "\", or say why it stands on its own.",
          "naming|parent-name|" + parent);
    }
  }

  // ---- Deprecation is marked the house way (figma-standard rule 14) ---------------
  // A component on a deprecated page (the page marker, or a page in the
  // deprecated category) carries the deprecation prefix; a component whose name
  // says DEPRECATED any other way is marked the wrong way; a page in the
  // deprecated category carries the page marker. Each value comes from TOKENS.
  if (T.deprecatedNamePrefix) {
    ran.push("deprecation");
    const DP = T.deprecatedNamePrefix, PM = T.deprecatedPagePrefix || null, DC = T.deprecatedCategory || null;
    const H = T.sectionHeader ? new RegExp(T.sectionHeader) : null;
    const catOfP = new Map(); let cat = null;
    for (const p of facts.pages) { if (H && H.test(p.name)) { cat = bare(p.name); continue; } if (!divider(p.name)) catOfP.set(p.name, cat); }
    const inDepCat = (page) => DC && catOfP.get(page) && catOfP.get(page).toUpperCase() === DC.toUpperCase();
    if (PM) for (const p of facts.pages) if (inDepCat(p.name) && !p.name.startsWith(PM))
      push("Page list", null, p.name, "warning", "deprecation", "Page \"" + p.name + "\" sits in the " + DC + " category without the " + PM + " marker, so it reads as current",
        "In Figma: rename the page to start with " + PM + ".", "deprecation|page|" + p.name);
    for (const c of facts.components) {
      const onDep = (PM && (c.page || "").startsWith(PM)) || inDepCat(c.page);
      const saysDep = !!DC && c.name.toUpperCase().includes(DC.toUpperCase());
      // A private part keeps `_` first, the prefix after it: Figma publishes a name that does not start with `_`.
      const P = T.internalPrefix || "";
      if (P && c.name.startsWith(DP) && c.name.slice(DP.length).startsWith(P)) {
        push(c.name, c.id, c.page, "error", "deprecation", "Puts the deprecation prefix before " + P + ", so Figma publishes this private part",
          "In Figma: rename it to \"" + P + DP + c.name.slice(DP.length + P.length) + "\".", "deprecation|publishes");
        continue;
      }
      if (c.name.startsWith(DP) || (P && c.name.startsWith(P + DP))) continue;
      if (!onDep && !saysDep) continue;
      push(c.name, c.id, c.page, "warning", "deprecation",
        saysDep ? "Marked deprecated without the house prefix, so a search or filter for deprecated components misses it" : "Sits on a deprecated page without the deprecation prefix, so people placing it are not told it is leaving",
        "In Figma: rename it to start with \"" + DP + "\", the recorded deprecation prefix, and say what replaces it in its description.",
        "deprecation|name");
    }
  }

  /*
   * ---- Mode pins (extended collections, and every collection) -----------
   *
   * A frame pins a mode per collection, and those pins outlive the library
   * they were made against. Two shapes, both measured on a real library the
   * day this was written, both silent — Figma renders a default and says
   * nothing.
   *
   * GENERATIONS. Reorganising a collection's modes does not rewrite the pins;
   * the file ends up holding several collection objects of the same name,
   * each with its own modes. One library had three generations of its brand
   * collection pinned at once: `[Brand C, Brand B]` on 64 frames, `[Brand A,
   * Brand B]` on 25, and the current `[Light, Dark]` on 22. Only the last resolves to
   * what the library publishes now.
   *
   * TRIED AND REJECTED: "the collection's library provides no variables", as
   * a way to catch pins left over from a retired library. It cannot tell a
   * retired collection from a live one whose variables are all hidden from
   * publishing — which is exactly what a primitives tier is — and on the
   * library it was written against it reported the file's own
   * `01. Primitives - Colour` and the brand extension alongside the genuinely
   * dead one: three false findings out of four. A signal that cannot
   * distinguish the two is not a check.
   *
   * `facts.pins` is [{ page, node, id, collection, collectionId, modes,
   * mode, isExtension, theme }]. Absent — a snapshot stores no pins —
   * the checks do not run and say so rather than reporting a clean file.
   */
  if (facts.pins) {
    ran.push("mode-pin");
    const pins = facts.pins;
    // One entry per (name, collection object): several mean several generations.
    const gens = {};
    for (const p of pins) {
      const g = (gens[p.collection] = gens[p.collection] || {});
      const k = p.collectionId;
      (g[k] = g[k] || { modes: p.modes || [], pins: 0, sample: p });
      g[k].pins++;
    }
    for (const [name, byId] of Object.entries(gens)) {
      const ids = Object.keys(byId);
      if (ids.length < 2) continue;
      const sets = ids.map((k) => "[" + (byId[k].modes.join(", ") || "?") + "] \u00d7" + byId[k].pins);
      const all = pins.filter((p) => p.collection === name);
      const s0 = byId[ids[0]].sample;
      /*
       * What a stale pin costs depends on where it sits, and the first
       * version of this check called all of them errors. Screenshotting the
       * frame that produced the first finding showed it rendering perfectly:
       * an `Examples` frame pinned to a mode its collection no longer has,
       * with `Section` and `Sample` inside it pinning the current one — and
       * the nearest pin wins, so nothing was wrong on the canvas. An error
       * that a picture disproves teaches people to skip the report.
       */
      const inComponent = all.some((p) => p.inComponent);
      const allShadowed = all.every((p) => p.shadowed || byId[p.collectionId].modes.length === 0 || p.current);
      const sev = inComponent ? "error" : (allShadowed ? "review" : "warning");
      const cost = inComponent
        ? "Some sit inside a component, so the published component itself resolves to a default nobody chose."
        : (allShadowed
          ? "Every one of them is documentation furniture whose inner frames re-pin the current collection, so nothing renders wrongly today — it is tidy-up, and a trap for whoever edits those frames next."
          : "They are documentation furniture, so the cost is a panel showing a default nobody chose rather than a broken component.");
      push("Page list", s0.id || "", s0.page, sev, "mode-pin",
        ids.length + " generations of \u201c" + name + "\u201d are pinned in this file: " + sets.join(", ") +
          ". Only the modes the library publishes now can resolve. " + cost,
        "Re-pin those frames to the current collection, or clear the pin so they inherit. " +
          "Reorganising a collection\u2019s modes leaves old pins behind \u2014 Figma says as much about accepting an extended-collection update.",
        "mode-pin|generations|" + name);
    }
    // A brand pinned with no theme pinned beside it: the theme then comes from
    // whatever the page inherits, which is nobody's decision here.
    const brandOnly = pins.filter((p) => p.isExtension && !pins.some((q) => q.id === p.id && q.theme));
    if (brandOnly.length) {
      const names = [...new Set(brandOnly.map((p) => p.collection))];
      push("Page list", brandOnly[0].id || "", brandOnly[0].page, "review", "mode-pin",
        brandOnly.length + " frame" + (brandOnly.length === 1 ? " pins" : "s pin") + " a brand (" + names.join(", ") + ") without pinning a theme beside it, so " +
          (brandOnly.length === 1 ? "it shows" : "each shows") + " Light or Dark depending on where it sits",
        "Pin a theme beside the brand, or record that these frames inherit the theme on purpose.",
        "mode-pin|brand-without-theme|" + names.join(","));
    }
    if (!out.some((e) => e.candidates.some((c) => c.rule === "mode-pin"))) ran.push("mode-pin:clean");
  }

  /*
   * WHAT THIS RUN ACTUALLY READ, not only what it found.
   *
   * `out` holds an entry per finding, so a clean library and a scan that
   * never ran are the same answer from here: an empty list. The caller files
   * with `full: true`, and a full run is allowed to close the rows it no
   * longer raises — so a check that silently did not run closed its own rows
   * with "a full run no longer raises this", while the thing it checks was
   * still wrong. Every check here is gated on a setting from the project's
   * context document (`sectionHeader`, `groupSeparator`, `familySeparator`),
   * and a document missing one makes its check vanish without a word.
   *
   * So the run says what it examined — every component it was given, plus the
   * page list where the file-level checks live — and which checks ran at all.
   * The caller sends `reach` as the closing scope, and then a scan that read
   * nothing closes nothing, because it named nothing.
   */
  return {
    audited: out,
    reach: ["Page list"].concat(live.map((c) => c.name)),
    ran: ran.slice(),
    // Named so a reader is told rather than left to infer it from silence.
    notRun: ["page-order", "separator", "parent-name", "deprecation", "mode-pin", "page-template", "status-marker"]
      .filter((r) => ran.indexOf(r) === -1 && ran.indexOf(r + ":n/a") === -1),
    // Checks whose setting IS recorded but whose subject this project does
    // not have — silence here means "nothing to check", not "not checked".
    notApplicable: ran.filter((r) => r.endsWith(":n/a")).map((r) => r.slice(0, -4)),
  };
}

if (typeof figma === "undefined") return checkFacts;

await figma.loadAllPagesAsync();
const TOK = (typeof TOKENS !== "undefined" && TOKENS) || {};
const SECTION = TOK.sectionHeader ? new RegExp(TOK.sectionHeader) : null;
const SKIP = new Set(TOK.excludeSections || []);
const PAGES = TOK.componentPages ? new RegExp(TOK.componentPages) : null;

const pages = figma.root.children.map((p) => ({ name: p.name, id: p.id }));
const components = [];
const byId = new Map();
let section = null;
for (const p of figma.root.children) {
  if (SECTION && SECTION.test(p.name)) section = p.name;
  const inScope = !(section && SKIP.has(section)) && !(PAGES && !PAGES.test(p.name));
  await p.loadAsync();
  for (const s of p.findAllWithCriteria({ types: ["COMPONENT_SET", "COMPONENT"] })) {
    if (s.type === "COMPONENT" && s.parent && s.parent.type === "COMPONENT_SET") continue;
    const c = { name: s.name, id: s.id, page: p.name, inScope, parents: [] };
    components.push(c);
    byId.set(s.id, c);
  }
}

// Parents: for every set, each instance directly inside one of its variants —
// no other instance between them, or a child of a child would be credited to
// its grandparent. Resolved once per (variant, layer name), which is how many
// distinct children a variant can hold.
for (const c of components) {
  const s = await figma.getNodeByIdAsync(c.id);
  if (!s) continue;
  const variants = s.type === "COMPONENT_SET" ? s.children : [s];
  const seen = new Set();
  for (const v of variants) {
    for (const i of v.findAllWithCriteria({ types: ["INSTANCE"] })) {
      let q = i.parent, direct = true;
      while (q && q !== v) { if (q.type === "INSTANCE") { direct = false; break; } q = q.parent; }
      if (!direct) continue;
      const key = v.id + "::" + i.name;
      if (seen.has(key)) continue;
      seen.add(key);
      const m = await i.getMainComponentAsync().catch(() => null);
      if (!m) continue;
      const setNode = m.parent && m.parent.type === "COMPONENT_SET" ? m.parent : m;
      const child = byId.get(setNode.id);
      if (child && child !== c && !child.parents.includes(c.name)) child.parents.push(c.name);
    }
  }
}

// ---- Component-page templates (figma-standard rule 15) ----------------
// Per page holding in-scope components: its section cards' titles in canvas
// order (top to bottom, then left to right), whether its primary component
// (named like the page, else the first) has variant axes or booleans, and
// whether it is a building-block page. A card is an instance named as the
// settings name the section component, outside any component; its title is
// the text inside it that names a recorded section.
const templates = [];
if (TOK.pageSections && TOK.pageSectionComponent) {
  const inComponent = (n) => { for (let q = n.parent; q && q.type !== "PAGE"; q = q.parent) if (q.type === "COMPONENT" || q.type === "COMPONENT_SET") return true; return false; };
  for (const p of figma.root.children) {
    const own = components.filter((c) => c.page === p.name && c.inScope);
    if (!own.length) continue;
    const cards = p.findAll((n) => n.type === "INSTANCE" && n.name === TOK.pageSectionComponent && !inComponent(n))
      .map((n) => ({ n, box: n.absoluteBoundingBox || { x: 0, y: 0 } }))
      .sort((a, b) => a.box.y - b.box.y || a.box.x - b.box.x);
    const sections = [];
    for (const { n } of cards) {
      const t = n.findOne((x) => x.type === "TEXT" && TOK.pageSections.indexOf(x.characters.trim()) > -1);
      if (t) sections.push(t.characters.trim());
    }
    const bareName = p.name.replace(TOK.pageMarker ? markerRe(TOK.pageMarker) : /^$/, "").trim();
    const primary = own.find((c) => c.name.replace(TOK.statusMarker || "\u0000", "").replace(/\s+/g, " ").trim() === bareName) || own[0];
    const node = await figma.getNodeByIdAsync(primary.id);
    const defs = (node && node.type === "COMPONENT_SET" && node.componentPropertyDefinitions) || (node && node.componentPropertyDefinitions) || {};
    const primaryAxes = Object.values(defs).some((d) => d.type === "VARIANT" || d.type === "BOOLEAN");
    const blocks = own.every((c) => (TOK.internalPrefix && c.name.startsWith(TOK.internalPrefix)) || c.parents.length > 0);
    templates.push({ page: p.name, sections, primaryAxes, blocks });
  }
}

// ---- Mode pins ---------------------------------------------------------
// Every node that pins a mode, with the collection object it pins resolved.
// The collection's ID is kept, not just its name: reorganising modes leaves
// several collections of one name in a file, and the id is what tells them
// apart. `empty` asks the library itself whether the collection still
// provides variables — a remote collection carries no `variableIds` in a
// consuming file, so counting those would call every live library dead.
const pins = [];
const colCache = new Map();
const colOf = async (id) => {
  if (!colCache.has(id)) {
    let c = null;
    try { c = await figma.variables.getVariableCollectionByIdAsync(id); } catch (e) {}
    colCache.set(id, c);
  }
  return colCache.get(id);
};
for (const p of figma.root.children) {
  await p.loadAsync();
  const stack = [...p.children];
  while (stack.length) {
    const n = stack.pop();
    const set = n.explicitVariableModes;
    if (set) {
      for (const colId of Object.keys(set)) {
        const col = await colOf(colId);
        const modeId = set[colId];
        const mode = col ? (col.modes.find((m) => m.modeId === modeId) || null) : null;
        let anc = n.parent, inComponent = false;
        while (anc && anc.type !== "PAGE") { if (anc.type === "COMPONENT" || anc.type === "COMPONENT_SET") { inComponent = true; break; } anc = anc.parent; }
        // Does something inside this frame pin the same collection again? The
        // nearest pin wins, so a re-pinned descendant makes this one inert.
        let shadowed = false;
        if (n.children) {
          const inner = [...n.children];
          while (inner.length && !shadowed) {
            const q = inner.pop();
            const qs = q.explicitVariableModes;
            if (qs) for (const qid of Object.keys(qs)) {
              const qc = await colOf(qid);
              if (qc && col && qc.name === col.name && qid !== colId) { shadowed = true; break; }
            }
            if (q.children) for (const c of q.children) inner.push(c);
          }
        }
        pins.push({
          inComponent, shadowed,
          current: !!mode && col && col.modes.some((x) => /^(light|dark)$/i.test(x.name)),
          page: p.name, node: n.name, id: n.id, collectionId: colId,
          collection: col ? col.name : "(unresolved)",
          modes: col ? col.modes.map((m) => m.name) : [],
          mode: mode ? mode.name : "(gone)",
          isExtension: !!(col && col.isExtension),
          theme: !!(mode && /^(light|dark)$/i.test(mode.name)),
        });
      }
    }
    if (n.children) for (const c of n.children) stack.push(c);
  }
}

return Object.assign(checkFacts({ pages, components, pins, templates }, TOK), { fileKey: figma.fileKey || null, fileName: figma.root.name });
