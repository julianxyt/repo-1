import { chromium } from 'playwright';
import path from 'path';
const SP='/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/';
const errs=[];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport:{width:412,height:915}, deviceScaleFactor:2});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
await p.goto('file://' + path.resolve('index.html'));
await p.waitForTimeout(1100);

// 1. every species resolves to a real palette, and no palette is malformed
const pal = await p.evaluate(() => {
  const names = [...document.querySelectorAll('.dex-name')].map(n => n.textContent);
  const bad = [], noBody = [];
  const sils = new Set();
  for (const n of names) {
    const sp = { name:n };
    const key = LOOK_OF[n];
    const L = LOOKS[key || 'lbj'];
    if (key && !LOOKS[key]) bad.push(n + ' -> ' + key);
    else if (!L || L.length !== 4) bad.push(n);
  }
  for (const k of Object.keys(LOOK_BY_SIL)) { sils.add(k); if (!BODY[k]) noBody.push(k); }
  const patterns = new Set(Object.values(LOOKS).map(v => v[3]));
  return {names:names.length, palettes:Object.keys(LOOKS).length, mapped:Object.keys(LOOK_OF).length,
          bad, noBody, patterns:[...patterns], archetypes:sils.size};
});
console.log('species:', pal.names, '| palettes:', pal.palettes, '| named mappings:', pal.mapped);
console.log('archetypes with a body region:', pal.archetypes - pal.noBody.length, 'of', pal.archetypes);
console.log('unresolved palette keys:', pal.bad.length ? pal.bad : 'none');
console.log('archetypes with no body region:', pal.noBody.length ? pal.noBody : 'none');
console.log('patterns in use:', pal.patterns.join(', '));

// 2. the entry shows a plate; the photos section sits well below it
await p.fill('#search','zebra'); await p.waitForTimeout(400);
await p.locator('.dex').first().click(); await p.waitForTimeout(450);
console.log('plate in window:', await p.locator('#platewin .plate').count());
const geo = await p.evaluate(() => {
  const w = document.querySelector('#platewin').getBoundingClientRect();
  const y = document.querySelector('.yourshots').getBoundingClientRect();
  return {plateTop: Math.round(w.top), plateW: Math.round(w.width),
          shotsTop: Math.round(y.top + window.scrollY), viewport: window.innerHeight};
});
console.log('plate window:', geo.plateW + 'px at y=' + geo.plateTop);
console.log('your-photos starts at y=' + geo.shotsTop + ' (viewport ' + geo.viewport + ') — needs a scroll:',
            geo.shotsTop > geo.viewport);

// zebra should be striped: count the stripe rects the renderer emitted
console.log('zebra stripe marks:', await p.locator('#platewin .plate rect').count());
await p.screenshot({path:SP+'entry-plate.png'});

// 3. clicking the plate expands it
await p.locator('#platewin').click(); await p.waitForTimeout(400);
console.log('lightbox open:', await p.locator('.lightbox').count(), '| caption says reference:',
  (await p.locator('.lb-cap').textContent()).includes('not a photograph'));
await p.screenshot({path:SP+'lightbox.png'});
await p.locator('.lightbox').click(); await p.waitForTimeout(300);
console.log('dismissed:', await p.locator('.lightbox').count() === 0);

// 4. a stored photo also expands, from the bottom section
await p.locator('#btnPick').click();
await p.setInputFiles('#filePick', [SP+'leopard.png']);
await p.locator('#cSave').waitFor({state:'visible', timeout:8000});
await p.locator('#cSave').click(); await p.waitForTimeout(1300);
console.log('shots in the bottom section:', await p.locator('.yourshots .shot').count());
await p.locator('.yourshots .shot img').first().click(); await p.waitForTimeout(400);
console.log('photo lightbox:', await p.locator('.lightbox .lb-img').count());
console.log('card still shows the plate-free silhouette:',
  await p.evaluate(() => !!document.querySelector('#platewin')));
console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
