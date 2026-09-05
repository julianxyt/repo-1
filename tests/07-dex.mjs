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

// 1. every species must have a blurb, a habitat line, and a silhouette that exists
const audit = await p.evaluate(() => {
  const names = [...document.querySelectorAll('.dex-name')].map(n => n.textContent);
  const drawn = new Set([...document.querySelectorAll('symbol[id^="sil-"]')].map(s => s.id.slice(4)));
  const missDex = [], missSil = [], badRef = [];
  for (const n of names) {
    const d = DEX[n];
    if (!d) { missDex.push(n); continue; }
    if (!d[1] || !d[2]) missSil.push(n);
  }
  // every rendered <use> must point at a symbol that exists
  for (const u of document.querySelectorAll('.shotwin .sil use')) {
    const id = u.getAttribute('href').slice(5);
    if (!drawn.has(id)) badRef.push(id);
  }
  return {species:names.length, dexKeys:Object.keys(DEX).length, drawn:drawn.size,
          missDex, incomplete:missSil, badRef:[...new Set(badRef)]};
});
console.log('species:', audit.species, '| dex keys:', audit.dexKeys, '| silhouettes drawn:', audit.drawn);
console.log('species with no dex entry:', audit.missDex.length ? audit.missDex : 'none');
console.log('entries missing where/note:', audit.incomplete.length ? audit.incomplete : 'none');
console.log('silhouette refs with no symbol:', audit.badRef.length ? audit.badRef : 'none');
console.log('silhouettes rendered on cards:', await p.locator('.shotwin .sil').count());

// 2. new collections
await p.locator('#tab-coll').click(); await p.waitForTimeout(600);
console.log('COLLECTIONS ->', await p.evaluate(() =>
  [...document.querySelectorAll('.collcard')].map(c =>
    c.querySelector('h3').textContent + ' (' + c.querySelectorAll('.colllist button').length + ')')));
await p.locator('#tab-list').click(); await p.waitForTimeout(400);

// 3. tree squirrel is back, with its dex entry
await p.fill('#search','tree squirrel'); await p.waitForTimeout(400);
console.log('squirrel found:', await p.locator('.dex-name').first().textContent());
await p.locator('.dex').first().click(); await p.waitForTimeout(400);
const secs = await p.evaluate(() => [...document.querySelectorAll('.dexsec')].map(s =>
  s.querySelector('h3').textContent + ': ' + s.querySelector('p').textContent.slice(0,52)));
console.log('entry sections:');
secs.forEach(x => console.log('   ', x));
console.log('silhouette in big panel:', await p.locator('#bigshot .sil').count());
await p.screenshot({path:SP+'dex-entry-new.png'});

// 4. reframe an existing photo: add one, then recrop it smaller
await p.locator('#btnPick').click();
await p.setInputFiles('#filePick', [SP+'leopard.png']);
await p.locator('#cSave').waitFor({state:'visible', timeout:8000});
await p.locator('#cSize button').nth(2).click();      // High
await p.locator('#cSave').click(); await p.waitForTimeout(1400);
const size1 = await p.evaluate(() => new Promise(res => { const q = indexedDB.open('kruger-life-list');
  q.onsuccess = () => { const t = q.result.transaction('photos').objectStore('photos').getAll();
    t.onsuccess = () => res(t.result.map(r => r.full.size)); }; }));
console.log('stored at High:', size1);
console.log('reframe button present:', await p.locator('.shot .recrop').count());
await p.locator('.shot .recrop').first().click();
await p.locator('#cSave').waitFor({state:'visible', timeout:8000});
await p.locator('#cSize button').first().click();     // Compact
await p.locator('#cZoom').fill('200');
await p.waitForTimeout(250);
await p.locator('#cSave').click(); await p.waitForTimeout(1400);
const size2 = await p.evaluate(() => new Promise(res => { const q = indexedDB.open('kruger-life-list');
  q.onsuccess = () => { const t = q.result.transaction('photos').objectStore('photos').getAll();
    t.onsuccess = () => res(t.result.map(r => r.full.size)); }; }));
console.log('after reframe to Compact:', size2, '| photo count unchanged:', size2.length === size1.length);
console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
