// A component's Properties table rows, from its props as one neutral list: the one set of rules for the
// docs site (tools/component-contract/contract-rows.mjs, which reads the props from the stored contract)
// and the Figma table (figma-properties-table's scripts/properties-table.js, which reads them from the open
// file and keeps a copy of this function, line for line, held by test-prop-rows.mjs). Two
// sources, one mechanism: only where the props come from differs.
//
// Each prop, in declared order:
//   name      the prop's Figma name
//   type      Figma's: VARIANT (any variant axis), BOOLEAN, TEXT, INSTANCE_SWAP, SLOT
//   options   a variant axis's options, verbatim in Figma's order and spelling
//   default   the default as Figma spells it (a boolean's true or false)
//   at        the place of the first layer the prop drives, numbers compared in turn (earlier first,
//             a prefix before what extends it), or null when it drives none
//   gate      the Figma name of the innermost other boolean that shows that layer, or null
//   when      the axes' values that layer is drawn under, exactly, as { axis name: [values] }, or null
//   evidence  passed through to the row, for a person checking a note
//
// Rows: variant axes first in declared order, the rest in layer order, those that drive no layer last.
// Options verbatim, never reordered; only a False/True axis marks its default. A boolean has no option
// order in Figma, so False then True is a convention. Notes from the gate and `when`, capped at two.
export const propRows = (props) => {
  const LABEL = { VARIANT: 'Variant', BOOLEAN: 'Boolean', TEXT: 'Editable string', INSTANCE_SWAP: 'Component swap', SLOT: 'Slot' };
  const earlier = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
  const lower = (v) => String(v).toLowerCase();
  const axes = props.filter((p) => p.type === 'VARIANT');
  const rest = props.filter((p) => p.type !== 'VARIANT');
  const placed = rest.filter((p) => p.at).sort((a, b) => earlier(a.at, b.at));
  const order = axes.concat(placed, rest.filter((p) => !p.at));
  return order.map((p) => {
    let options = '-';
    if (p.type === 'VARIANT') {
      const o = p.options || [];
      const binary = o.length === 2 && o.every((v) => v === 'True' || v === 'False');
      options = binary ? o.map((v) => (v === p.default ? v + ' (default)' : v)).join('\n') : o.join('\n');
    } else if (p.type === 'BOOLEAN') {
      const on = p.default === true || p.default === 'true';
      options = ['False', 'True'].map((v) => ((v === 'True') === on ? v + ' (default)' : v)).join('\n');
    }
    let notes = '-';
    if (p.type !== 'VARIANT') {
      const conds = [];
      if (p.gate) conds.push(lower(p.gate) + '=true');
      for (const [axis, vals] of Object.entries(p.when || {})) if (axis !== p.gate) conds.push(lower(axis) + '=' + [].concat(vals).map(lower).join(' or '));
      if (conds.length) notes = 'Only for ' + conds.slice(0, 2).join(' and ');
    }
    return { values: [p.name, LABEL[p.type] || p.type, options, notes], evidence: p.evidence || null };
  });
};
