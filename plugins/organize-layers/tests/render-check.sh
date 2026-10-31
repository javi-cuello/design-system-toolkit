#!/bin/bash
# Run: plugins/organize-layers/tests/render-check.sh [--keep]
#
# Renders ui.html headlessly at the plugin's own 260x420, in light and dark, and
# measures it. It exists because `.input-compact{width:56px}` was measured at
# 468px: ui-base's `input[type=text]` carries an attribute selector, so a bare
# class ties with it on specificity and loses on source order. Nothing else in
# this repo could see that — the ui-base collision rule in skill-standard §B 4
# names the trap, and a rule can only tell you to look.
#
# What it can and cannot judge. Layout is exact: ui.html uses no viewport units
# and no media queries, so a 260px containing block lays out identically to a
# 260px window (asserted below). Colour is INDICATIVE only — Figma injects the
# real --figma-color-* values at runtime and the ones here are the fallbacks
# already recorded in this repo's other plugins. Use --keep and look at the two
# PNGs for anything about contrast; trust the numbers for anything about size.

set -u
here=$(cd "$(dirname "$0")" && pwd)
plugin=$(cd "$here/.." && pwd)
keep=0; [ "${1:-}" = "--keep" ] && keep=1

# Any Chromium will do, and none of them is guaranteed to be here: this check
# was written against /Applications/Google Chrome.app and that binary was gone
# the next day. Exit 2, not 0, when none is found — the first version printed
# "skip" and exited 0, which is indistinguishable from a pass to anything
# reading the exit code, and to anyone skimming the output.
CHROME=""
for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "/Applications/Chromium.app/Contents/MacOS/Chromium" \
         "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
         "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
         "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
  [ -x "$c" ] && { CHROME="$c"; break; }
done
if [ -z "$CHROME" ]; then
  for c in "$HOME"/Library/Caches/ms-playwright/chromium-*/chrome-mac/Chromium.app/Contents/MacOS/Chromium \
           "$HOME"/.cache/puppeteer/chrome/*/chrome-mac*/Google\ Chrome*.app/Contents/MacOS/Google\ Chrome*; do
    [ -x "$c" ] && { CHROME="$c"; break; }
  done
fi
if [ -z "$CHROME" ]; then
  echo "DID NOT RUN — no Chromium found, so the layout was NOT measured."
  echo "  Install one, or: npx playwright install chromium"
  echo "  Looked in /Applications (Chrome, Chromium, Brave, Edge), ~/Applications,"
  echo "  and the playwright and puppeteer caches."
  exit 2
fi
echo "  browser: $CHROME"

work=$(mktemp -d)
[ $keep -eq 0 ] && trap 'rm -rf "$work"' EXIT

grep -qE '@media|[0-9]v[wh]\b' "$plugin/ui.html" && {
  echo "FAIL — ui.html now uses a media query or viewport units, so a fixed-width"
  echo "       containing block no longer stands in for a real window. Re-do this"
  echo "       check with an iframe sized 260x420."
  exit 1
}

python3 - "$work" "$plugin/ui.html" <<'PY'
import sys
work, uipath = sys.argv[1], sys.argv[2]
ui = open(uipath, encoding='utf-8').read()

THEMES = {
 'light': """:root{--figma-color-bg:#ffffff;--figma-color-bg-secondary:#f5f5f5;--figma-color-bg-tertiary:#ebebeb;
--figma-color-text:#1e1e1e;--figma-color-text-secondary:#8c8c8c;--figma-color-text-tertiary:#b3b3b3;
--figma-color-border:#e6e6e6;--figma-color-border-strong:#b3b3b3;--figma-color-border-selected:#0d99ff;
--figma-color-bg-brand:#0d99ff;--figma-color-bg-brand-hover:#007be5;--figma-color-text-onbrand:#ffffff;
--figma-color-icon-onbrand:#ffffff;--figma-color-bg-disabled:#e6e6e6;--figma-color-text-ondisabled:#b3b3b3}""",
 'dark': """:root{--figma-color-bg:#2c2c2c;--figma-color-bg-secondary:#383838;--figma-color-bg-tertiary:#444444;
--figma-color-text:#ffffff;--figma-color-text-secondary:#b3b3b3;--figma-color-text-tertiary:#7a7a7a;
--figma-color-border:#444444;--figma-color-border-strong:#7a7a7a;--figma-color-border-selected:#0d99ff;
--figma-color-bg-brand:#0d99ff;--figma-color-bg-brand-hover:#007be5;--figma-color-text-onbrand:#ffffff;
--figma-color-icon-onbrand:#ffffff;--figma-color-bg-disabled:#4d4d4d;--figma-color-text-ondisabled:#7a7a7a}"""
}

# The state a real run produces, so what is measured is the populated UI.
DRIVE = """<script>
window.parent = { postMessage: function () {} };
setTimeout(function () {
  applySettings({ delimiter: '-', grouped: true, gapX: 200, gapY: 80 });
  renderPreview({ type: 'preview', count: 6, skipped: 0, columns: [
    [{key:'1',rest:'1'},{key:'1',rest:'2'},{key:'1',rest:'3'},{key:'1',rest:'10'}],
    [{key:'2',rest:'1'}], [{key:'3',rest:'1'}] ]});
}, 0);
</script>"""

PROBE = """<style>html{width:260px}</style>
<script>
setTimeout(function () {
  function w(sel){var e=document.querySelector(sel);return e?Math.round(e.getBoundingClientRect().width):-1;}
  var over=[];
  Array.prototype.forEach.call(document.querySelectorAll('*'),function(e){
    var r=e.getBoundingClientRect();
    if(r.right>260.5||r.left<-0.5)over.push(e.tagName+'.'+e.className+'@'+Math.round(r.right));});
  document.title=['w='+document.body.scrollWidth,'h='+document.body.scrollHeight,
    'delimiter='+w('#delimiter'),'gapY='+w('#gapY'),'gapX='+w('#gapX'),
    'run='+w('#run'),'box='+w('.checkbox .box'),
    'segH='+w('#dir-horizontal'),'segV='+w('#dir-vertical'),
    'previewClass='+document.querySelector('.preview').className.replace(/\s+/g,'-'),
    'group='+w('.preview .col'),
    'over='+(over.length?over.join('|'):'none')].join(' ');
}, 60);
</script>"""

for theme, tokens in THEMES.items():
    body = ui.replace('</style>', tokens + '</style>', 1).replace('</body>', DRIVE + '</body>', 1)
    open(work + '/view-' + theme + '.html', 'w', encoding='utf-8').write(body)
    open(work + '/probe-' + theme + '.html', 'w', encoding='utf-8').write(
        body.replace('<head>', '<head><title>pending</title>', 1).replace('</body>', PROBE + '</body>', 1))
    vertical = body.replace("direction: 'horizontal'", "direction: 'vertical'").replace(
        "grouped: true, gapX", "grouped: true, direction: 'vertical', gapX").replace(
        "count: 6, skipped: 0", "count: 6, skipped: 0, direction: 'vertical'")
    open(work + '/probe-' + theme + '-v.html', 'w', encoding='utf-8').write(
        vertical.replace('<head>', '<head><title>pending</title>', 1).replace('</body>', PROBE + '</body>', 1))
    open(work + '/frame-' + theme + '.html', 'w', encoding='utf-8').write(
        '<body style="margin:0;background:#777;padding:12px"><iframe src="view-' + theme +
        '.html" style="width:260px;height:420px;border:0;display:block"></iframe></body>')
PY

fails=0
say_fail() { echo "  FAIL  $*"; fails=$((fails + 1)); }

for theme in light dark light-v dark-v; do
  case "$theme" in *-v) probe="probe-${theme%-v}-v.html";; *) probe="probe-$theme.html";; esac
  title=$("$CHROME" --headless --disable-gpu --virtual-time-budget=4000 \
          --dump-dom "file://$work/$probe" 2>/dev/null \
          | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
  [ "$title" = "pending" ] || [ -z "$title" ] && { say_fail "$theme · the probe did not report"; continue; }
  echo "  $theme: $title"

  get() { echo "$title" | tr ' ' '\n' | grep "^$1=" | cut -d= -f2; }
  [ "$(get w)" -le 260 ] || say_fail "$theme · horizontal overflow at 260px: $(get w)"
  [ "$(get h)" -le 420 ] || say_fail "$theme · taller than the 420px window: $(get h)"
  [ $((420 - $(get h))) -le 8 ] || say_fail "$theme · $((420 - $(get h)))px of dead space — showUI's height has drifted from the content"
  # 56 is what .input-compact asks for. A full-width answer means ui-base won.
  [ "$(get delimiter)" = "56" ] || say_fail "$theme · the separator input is $(get delimiter)px, not 56 — ui-base's input[type=text] is winning on source order"
  [ "$(get gapY)" = "$(get gapX)" ] || say_fail "$theme · the two gap inputs differ: $(get gapY) vs $(get gapX)"
  [ "$(get box)" = "12" ] || say_fail "$theme · the checkbox box is $(get box)px, not 12"
  # ui-base styles bare `button`; the two halves matching proves neither is
  # being sized by it and that both labels fit at 260px.
  [ "$(get segH)" = "$(get segV)" ] || say_fail "$theme · the segmented halves differ: $(get segH) vs $(get segV)"
  [ "$(get segH)" -ge 100 ] || say_fail "$theme · the segmented control collapsed to $(get segH)px"
  [ "$(get over)" = "none" ] || say_fail "$theme · past the right edge: $(get over)"
  case "$theme" in
    *-v) [ "$(get previewClass)" = "preview-vertical" ] || say_fail "$theme · the preview did not transpose: $(get previewClass)"
         [ "$(get group)" -gt 100 ] || say_fail "$theme · the preview group is $(get group)px wide — still a stack, so .preview.vertical .col is not applying" ;;
    *)   [ "$(get previewClass)" = "preview" ] || say_fail "$theme · the preview transposed when it should not: $(get previewClass)"
         [ "$(get group)" -lt 100 ] || say_fail "$theme · the preview group is $(get group)px wide — laid out as a row when it should be a stack" ;;
  esac
done

if [ $keep -eq 1 ]; then
  for theme in light dark; do
    "$CHROME" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=2500 \
      --screenshot="$work/$theme.png" --window-size=284,444 "file://$work/frame-$theme.html" >/dev/null 2>&1
  done
  echo "  screenshots: $work/light.png  $work/dark.png"
  echo "  (colour here is indicative — Figma injects the real token values)"
fi

echo
[ $fails -eq 0 ] && echo "pass — layout holds at 260x420 in both themes" || echo "FAIL — $fails"
exit $([ $fails -eq 0 ] && echo 0 || echo 1)
