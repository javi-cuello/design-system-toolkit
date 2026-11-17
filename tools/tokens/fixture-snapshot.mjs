// A generic, invented snapshot tokens file the token suites export: two
// tiers sharing Light/Dark, a responsive type collection, a text style bound to
// it, an inner shadow and a gradient. No project data.
export const snapshot = () => ({
  _meta: { file: 'UI library', fileId: 'x' },
  collections: {
    'Primitives - Colour': { modes: ['Light', 'Dark'], values: { Light: { 'Palette/Grey/12': '#161616' }, Dark: { 'Palette/Grey/12': '#f5f5f5' } }, alias: { Light: {}, Dark: {} } },
    Semantic: {
      modes: ['Light', 'Dark'],
      values: { Light: { 'Colour/Text/strong': '#161616', 'State/Disabled/opacity': 50 }, Dark: { 'Colour/Text/strong': '#f5f5f5', 'State/Disabled/opacity': 50 } },
      alias: { Light: { 'Colour/Text/strong': 'Palette/Grey/12' }, Dark: { 'Colour/Text/strong': 'Palette/Grey/12' } },
      descriptions: { 'Colour/Text/strong': 'Body text' },
    },
    'Responsive type': { modes: ['Desktop', 'Mobile'], values: { Desktop: { 'Heading/lg/size': 48, 'Heading/lg/family': 'Inter', 'Heading/lg/weight': 'Semi Bold' }, Mobile: { 'Heading/lg/size': 32, 'Heading/lg/family': 'Inter', 'Heading/lg/weight': 'Semi Bold' } }, alias: {} },
  },
  textStyles: [{ name: 'Heading/lg', family: 'Inter', weight: 'SemiBold', size: 48, lineHeight: 1.1, letterSpacing: 0,
    bound: { fontSize: { collection: 'Responsive type', name: 'Heading/lg/size' }, fontFamily: { collection: 'Responsive type', name: 'Heading/lg/family' }, fontWeight: { collection: 'Responsive type', name: 'Heading/lg/weight' } } }],
  effects: [{ name: 'Elevation/raised', layers: [{ type: 'INNER_SHADOW', x: 0, y: -1, blur: 0, spread: 1, color: 'rgb(22 22 22 / 0.03)' }] }],
  paintStyles: [{ name: 'Background/screen', paints: [{ type: 'GRADIENT_LINEAR', angle: 180, stops: [{ position: 0.25, color: 'Palette/Grey/12' }, { position: 1, color: '#ffffff' }] }] }],
});
