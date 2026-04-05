/**
 * Run inside Figma via Cursor MCP `use_figma` when connected.
 * fileKey: paoFtKOdkkoSAD02Intbjc
 * https://www.figma.com/design/paoFtKOdkkoSAD02Intbjc/ROAMV3
 *
 * Creates page `ref-viewer · loupe` with 3 tablet frames (horizontal row).
 */

const PAGE_NAME = 'ref-viewer · loupe';
const TABLET_W = 1194;
const TABLET_H = 834;
const PAD = 24;
const GAP = 24;
const BETWEEN_FRAMES = 80;

function rgb(r, g, b) {
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function fill(c) {
  return [{ type: 'SOLID', color: c }];
}

let page = figma.root.children.find((p) => p.name === PAGE_NAME);
if (!page) {
  page = figma.createPage();
  page.name = PAGE_NAME;
}
await figma.setCurrentPageAsync(page);

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

let startX = 80;
for (const child of page.children) {
  if (child.type === 'FRAME' && 'width' in child) {
    startX = Math.max(startX, child.x + child.width + BETWEEN_FRAMES);
  }
}

const innerW = TABLET_W - PAD * 2;
const leftW = Math.round(innerW * 0.6);
const rightW = innerW - leftW - GAP;
const videoH = 380;
const scrubH = 36;
const waveH = 72;
const topY = PAD;
const leftX = PAD;
const rightX = PAD + leftW + GAP;

const createdNodeIds = [];

function makeScreen(name, opts) {
  const { showLoupe, draggingHint } = opts;
  const root = figma.createFrame();
  root.name = name;
  root.resize(TABLET_W, TABLET_H);
  root.fills = fill(rgb(26, 26, 30));
  root.layoutMode = 'NONE';
  root.clipsContent = false;

  const left = figma.createFrame();
  left.name = 'video panel ~60%';
  left.x = leftX;
  left.y = topY;
  left.resize(leftW, TABLET_H - PAD * 2);
  left.fills = fill(rgb(16, 16, 20));
  left.cornerRadius = 12;
  left.layoutMode = 'NONE';
  root.appendChild(left);

  const video = figma.createFrame();
  video.name = 'reference video';
  video.x = 12;
  video.y = 12;
  video.resize(leftW - 24, videoH);
  video.fills = fill(rgb(48, 44, 62));
  video.cornerRadius = 8;
  video.clipsContent = true;
  left.appendChild(video);

  const vbg = figma.createRectangle();
  vbg.resize(video.width, video.height);
  vbg.fills = fill(rgb(55, 50, 75));
  video.appendChild(vbg);

  const dismiss = figma.createFrame();
  dismiss.name = 'Loupe dismiss-toggle · 56dp';
  dismiss.resize(56, 56);
  dismiss.x = video.width - 56 - 10;
  dismiss.y = 10;
  dismiss.fills = fill(showLoupe ? rgb(220, 70, 70) : rgb(80, 80, 90));
  dismiss.cornerRadius = 8;
  dismiss.opacity = showLoupe ? 1 : 0.2;
  video.appendChild(dismiss);

  const dx = figma.createText();
  dx.fontName = { family: 'Inter', style: 'Regular' };
  dx.fontSize = 22;
  dx.characters = '✕';
  dx.fills = fill(rgb(255, 255, 255));
  dx.x = 17;
  dx.y = 11;
  dismiss.appendChild(dx);

  if (showLoupe) {
    const loupe = figma.createEllipse();
    loupe.name = 'Loupe / lens';
    loupe.resize(150, 150);
    loupe.x = video.width * 0.42 - 75;
    loupe.y = video.height * 0.28 - 75;
    loupe.fills = fill(rgb(200, 198, 210));
    loupe.opacity = 0.4;
    loupe.strokes = fill(rgb(255, 255, 255));
    loupe.strokeWeight = 1;
    video.appendChild(loupe);

    const inner = figma.createEllipse();
    inner.resize(128, 128);
    inner.x = loupe.x + 11;
    inner.y = loupe.y + 11;
    inner.fills = fill(rgb(130, 110, 175));
    inner.opacity = 0.95;
    video.appendChild(inner);
  }

  if (draggingHint) {
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Regular' };
    t.fontSize = 12;
    t.characters = 'Two-finger drag — reposition loupe (zoom unchanged)';
    t.fills = fill(rgb(210, 210, 225));
    t.x = 12;
    t.y = video.height - 22;
    video.appendChild(t);
  }

  const scrub = figma.createFrame();
  scrub.name = 'scrub bar (keep 16px+ below dismiss)';
  scrub.x = 12;
  scrub.y = 12 + videoH + 10;
  scrub.resize(leftW - 24, scrubH);
  scrub.fills = fill(rgb(38, 38, 46));
  scrub.cornerRadius = 6;
  scrub.layoutMode = 'NONE';
  left.appendChild(scrub);

  const wave = figma.createFrame();
  wave.name = 'waveform';
  wave.x = 12;
  wave.y = scrub.y + scrubH + 10;
  wave.resize(leftW - 24, waveH);
  wave.fills = fill(rgb(28, 28, 36));
  wave.cornerRadius = 6;
  left.appendChild(wave);

  const right = figma.createFrame();
  right.name = 'session ~40%';
  right.x = rightX;
  right.y = topY;
  right.resize(rightW, TABLET_H - PAD * 2);
  right.fills = fill(rgb(20, 20, 26));
  right.cornerRadius = 12;
  right.layoutMode = 'NONE';
  root.appendChild(right);

  const title = figma.createText();
  title.fontName = { family: 'Inter', style: 'Semi Bold' };
  title.fontSize = 14;
  title.characters = 'Right panel placeholder';
  title.fills = fill(rgb(180, 180, 195));
  title.x = 16;
  title.y = 16;
  right.appendChild(title);

  const body = figma.createText();
  body.fontName = { family: 'Inter', style: 'Regular' };
  body.fontSize = 12;
  body.lineHeight = { unit: 'PIXELS', value: 18 };
  body.characters =
    'Sections · clips · record FAB\n\nSpec: docs/FIGMA_LOUPE_SPEC.md\nPRD: ROAM_PRD_FINAL__6_ · Screen 4 loupe';
  body.fills = fill(rgb(120, 120, 140));
  body.x = 16;
  body.y = 44;
  right.appendChild(body);

  page.appendChild(root);
  createdNodeIds.push(root.id);
  return root;
}

const specs = [
  { name: 'ref-viewer · loupe · off', showLoupe: false, draggingHint: false },
  { name: 'ref-viewer · loupe · on', showLoupe: true, draggingHint: false },
  { name: 'ref-viewer · loupe · dragging', showLoupe: true, draggingHint: true },
];

let cx = startX;
for (const s of specs) {
  const f = makeScreen(s.name, { showLoupe: s.showLoupe, draggingHint: s.draggingHint });
  f.x = cx;
  f.y = 80;
  cx += TABLET_W + BETWEEN_FRAMES;
}

return {
  ok: true,
  pageId: page.id,
  pageName: PAGE_NAME,
  createdFrameIds: createdNodeIds,
  note: 'Swap fills for ROAMV3 color variables when convenient.',
};
