import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const SP='/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/';
const errs=[];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport:{width:412,height:915}});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
await p.goto('file://' + path.resolve('index.html'));
await p.waitForTimeout(900);

// log three species, one with photos
for (const q of ['pangolin','lilac-breasted','honey badger']) {
  await p.fill('#search', q); await p.waitForTimeout(350);
  await p.locator('.dex').first().click(); await p.waitForTimeout(250);
  if (q === 'pangolin') {
    await p.locator('#btnPick').click();
    await p.setInputFiles('#filePick', [SP+'leopard.png']);
    await p.locator('#cSave').waitFor({state:'visible', timeout:8000});   // crop dialog
    await p.locator('#cSave').click();
    await p.waitForTimeout(1200);
  }
  else { await p.locator('#btnSeen').click(); await p.waitForTimeout(300); }
  await p.locator('#sheetBack').click(); await p.waitForTimeout(200);
}
await p.fill('#search',''); await p.waitForTimeout(400);
console.log('before export:', await p.textContent('#tallySeen'), 'logged');

// export via the real menu button (exercises doExport's fallback path)
const dl = p.waitForEvent('download', {timeout:15000});
await p.locator('#menuBtn').click(); await p.waitForTimeout(300);
await p.locator('#mExport').click();
const d = await dl;
const file = SP + 'backup.json';
await d.saveAs(file);
console.log('downloaded:', d.suggestedFilename(), fs.statSync(file).size, 'bytes');
const parsed = JSON.parse(fs.readFileSync(file,'utf8'));
console.log('backup contents: entries=', parsed.log.length, 'photos=', parsed.photos.length, 'app=', parsed.app);

// wipe everything, confirm empty, then restore from the file
await p.evaluate(() => new Promise(res => { const r = indexedDB.deleteDatabase('kruger-life-list'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
await p.reload(); await p.waitForTimeout(1000);
console.log('after wipe:', await p.textContent('#tallySeen'), 'logged');

await p.locator('#menuBtn').click(); await p.waitForTimeout(300);
await p.locator('#mRestore').click();
await p.setInputFiles('#fileRestore', file);
await p.waitForTimeout(2500);
console.log('after restore:', await p.textContent('#tallySeen'), 'logged');
console.log('toast:', await p.locator('.toast').count() ? await p.textContent('.toast') : '(none)');

await p.selectOption('#sort','recent'); await p.waitForTimeout(500);
console.log('restored + recent-first:', await p.evaluate(() => [...document.querySelectorAll('.dex-name')].slice(0,4).map(n=>n.textContent)));
console.log('photo survived restore:', await p.locator('.shotwin img').count());
await p.reload(); await p.waitForTimeout(1000);
console.log('after reload:', await p.textContent('#tallySeen'), 'logged');
console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
