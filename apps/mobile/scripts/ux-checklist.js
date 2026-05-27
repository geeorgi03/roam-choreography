/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const checks = [
  {
    name: 'Design tokens file exists',
    ok: () => fs.existsSync(path.join(root, 'lib', 'designTokens.ts')),
  },
  {
    name: 'Legacy dead-flow screens removed',
    ok: () =>
      !fs.existsSync(path.join(root, 'app', '(app)', 'settings.tsx')) &&
      !fs.existsSync(path.join(root, 'app', '(app)', 'map.tsx')),
  },
  {
    name: 'Session music setup route exists',
    ok: () => fs.existsSync(path.join(root, 'app', '(app)', 'session', 'music-setup.tsx')),
  },
  {
    name: 'Practice camera component exists',
    ok: () =>
      fs.existsSync(path.join(root, 'components', 'choreography', 'PracticeSelfCamera.tsx')),
  },
];

let failed = 0;
console.log('Roam UX Checklist');
console.log('-----------------');
for (const check of checks) {
  const pass = check.ok();
  if (!pass) failed += 1;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${check.name}`);
}

if (failed > 0) {
  console.error(`\nUX checklist failed: ${failed} check(s).`);
  process.exit(1);
}

console.log('\nUX checklist passed.');
