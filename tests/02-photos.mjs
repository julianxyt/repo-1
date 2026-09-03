import { chromium } from 'playwright';
import path from 'path';
const SP='/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/';
const errs=[];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport:{width:412,height:915}, deviceScaleFactor:2});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
await p.goto('file://' + path.resolve('index.html'));
await p.waitForTimeout(1000);

// open Leopard
await p.fill('#search','leopard');
await p.waitForTimeout(400);
await p.locator('.dex').first().click();
await p.waitForTimeout(300);
console.log('opened:', await p.textContent('#sheetName'));

// attach two photos via the gallery picker
await p.locator('#btnPick').click();
await p.setInputFiles('#filePick', [SP+'leopard.png', SP+'roller.png']);
// each file now opens the crop dialog; accept the default framing
for (let i = 0; i < 2; i++) {
  await p.locator('#cSave').waitFor({state:'visible', timeout:8000});
  await p.locator('#cSave').click();
  await p.waitForTimeout(600);
}
await p.waitForTimeout(900);
console.log('shots in gallery:', await p.locator('.shot').count());
console.log('auto-marked seen:', await p.textContent('#btnSeen'));
console.log('date auto-filled:', await p.inputValue('#fDate'));
await p.screenshot({path:SP+'shot-detail.png'});

// stored blob sizes: proof the resize actually ran
const sizes = await p.evaluate(() => new Promise(res => {
  const q = indexedDB.open('kruger-life-list');
  q.onsuccess = () => { const t = q.result.transaction('photos').objectStore('photos').getAll(); t.onsuccess = () => res(t.result.map(r => ({pid:r.pid, full:r.full.size, thumb:r.thumb.size, type:r.full.type}))); };
}));
console.log('stored blobs:', JSON.stringify(sizes));

await p.locator('#sheetBack').click();
await p.waitForTimeout(500);
await p.fill('#search','');
await p.waitForTimeout(500);
console.log('tally:', await p.textContent('#tallySeen'), '/', await p.textContent('#tallyTot'));
console.log('thumbs rendered in list:', await p.locator('.shotwin img').count());
console.log('multi badge:', await p.locator('.thumb .multi').count());

// export backup round-trip (plain-web fallback path)
const json = await p.evaluate(async () => {
  const log = window.__logRows();
  const photos = [];
  const b2d = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  for(const e of log) for(const pid of e.photos){ const rec = await window.__getPhoto(pid); photos.push({pid, full: await b2d(rec.full), thumb: await b2d(rec.thumb)}); }
  return JSON.stringify({app:'kruger-life-list', version:1, exportedAt:new Date().toISOString(), log, photos});
});
console.log('backup bytes:', json.length, '| entries:', JSON.parse(json).log.length, '| photos:', JSON.parse(json).photos.length);

// delete one photo
await p.fill('#search','leopard'); await p.waitForTimeout(400);
await p.locator('.dex').first().click(); await p.waitForTimeout(400);
await p.locator('.shot .del').first().click();
await p.waitForTimeout(800);
console.log('shots after delete:', await p.locator('.shot').count());

// progress view with a photo logged
await p.locator('#sheetBack').click(); await p.waitForTimeout(300);
await p.fill('#search',''); await p.waitForTimeout(300);
await p.locator('#tab-prog').click(); await p.waitForTimeout(600);
console.log('STATS ->', await p.evaluate(() => [...document.querySelectorAll('.stat')].map(s => s.querySelector('.stat-k').textContent+': '+s.querySelector('.stat-v').textContent+' / '+s.querySelector('.stat-sub').textContent)));
console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
