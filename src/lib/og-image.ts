import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { site } from '../config/site';
import { profile } from '../content/profile';
import { detectionScore } from './seeded';

const colors = {
  bg: '#0b0d0f',
  fg: '#e8eaed',
  muted: '#9aa3ad',
  accent: '#ff7a1a',
  accentFg: '#0b0d0f',
};

type OgStyle = Record<string, string | number>;
type OgChildren = string | OgElement | OgElement[];
interface OgElement {
  type: 'div';
  props: { style: OgStyle; children?: OgChildren };
}

function div(style: OgStyle, children?: OgChildren): OgElement {
  return { type: 'div', props: { style, children } };
}

function corner(position: OgStyle): OgElement {
  return div({
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.accent,
    borderStyle: 'solid',
    borderWidth: 0,
    ...position,
  });
}

function buildTree(): OgElement {
  return div(
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      backgroundColor: colors.bg,
      color: colors.fg,
      fontFamily: 'Space Grotesk',
    },
    [
      div({ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 26, color: colors.muted }, [
        div({ color: colors.accent }, `[${profile.initials}]`),
        div({ marginLeft: 20 }, `${profile.name} · ${profile.role}`),
      ]),
      div({ position: 'relative', display: 'flex', padding: '40px 44px' }, [
        corner({ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }),
        corner({ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }),
        corner({ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }),
        corner({ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }),
        div(
          {
            position: 'absolute',
            top: -24,
            left: 0,
            padding: '2px 10px',
            backgroundColor: colors.accent,
            color: colors.accentFg,
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
          },
          `ai_ml_engineer ${detectionScore('og-image')}`,
        ),
        div({ fontSize: 60, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1 }, profile.headline),
      ]),
      div(
        {
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 22,
          color: colors.muted,
        },
        [div({}, profile.status), div({ color: colors.accent }, 'portfolio')],
      ),
    ],
  );
}

async function loadFonts() {
  const fontsRoot = join(process.cwd(), 'node_modules', '@fontsource');
  const [sans, mono] = await Promise.all([
    readFile(join(fontsRoot, 'space-grotesk', 'files', 'space-grotesk-latin-600-normal.woff')),
    readFile(join(fontsRoot, 'jetbrains-mono', 'files', 'jetbrains-mono-latin-500-normal.woff')),
  ]);
  return [
    { name: 'Space Grotesk', data: sans, weight: 600 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
  ];
}

export async function renderOgImage(): Promise<Uint8Array<ArrayBuffer>> {
  // satori is typed for React elements; plain { type, props } objects are its documented JSX-free input.
  const tree = buildTree() as unknown as Parameters<typeof satori>[0];
  const { width, height } = site.ogImage;
  const svg = await satori(tree, { width, height, fonts: await loadFonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  return new Uint8Array(png);
}
