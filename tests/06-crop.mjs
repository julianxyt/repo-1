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

const blobs = () => p.evaluate(() => new Promise(res => {
  const q = indexedDB.open('kruger-life-list');
  q.onsuccess = () => { const t = q.result.transaction('photos').objectStore('photos').getAll();
    t.onsuccess = () => res(t.result.map(r => ({pid:r.pid, full:r.full.size, thumb:r.thumb.size}))); };
}));
const dims = async () => p.evaluate(() => new Promise(res => {
  const q = indexedDB.open('kruger-life-list');
  q.onsuccess = () => { const t = q.result.transaction('photos').objectStore('photos').getAll();
    t.onsuccess = async () => {
      const out = [];
      for(const r of t.result){
        const u = URL.createObjectURL(r.full);
        const im = await new Promise(k => { const i = new Image(); i.onload = () => k(i); i.src = u; });
        out.push(im.naturalWidth + 'x' + im.naturalHeight);
        URL.revokeObjectURL(u);
      }
      res(out);
    }; };
}));

async function openPicker(query){
  if (await p.locator('#sheetBack').count()) {          // close any open entry first
    await p.locator('#sheetBack').click(); await p.waitForTimeout(300);
  }
  await p.fill('#search', query); await p.waitForTimeout(350);
  await p.locator('.dex').first().click(); await p.waitForTimeout(350);
  await p.locator('#btnPick').click();
}

// 1. the dialog appears at all
await openPicker('leopard');
await p.setInputFiles('#filePick', [SP+'leopard.png']);
await p.locator('.cropper').waitFor({state:'visible', timeout:8000});
console.log('dialog opened:', await p.locator('.crop-frame img').count() === 1);
console.log('size options:', await p.locator('#cSize button').count());
console.log('default size pressed:', await p.locator('#cSize button[aria-pressed="true"]').textContent());
await p.screenshot({path:SP+'crop.png'});

// 2. cancel must store nothing
await p.locator('#cCancel').click(); await p.waitForTimeout(500);
console.log('after cancel — blobs stored:', (await blobs()).length, '| logged:', await p.textContent('#tallySeen'));

// 3. zoom in, pick Compact, save — output must be square and small
await p.locator('#btnPick').click();
await p.setInputFiles('#filePick', [SP+'leopard.png']);
await p.locator('.cropper').waitFor({state:'visible'});
await p.locator('#cSize button').first().click();          // Compact
await p.locator('#cZoom').fill('260');
await p.waitForTimeout(250);
const framed = await p.evaluate(() => {
  const i = document.querySelector('.crop-frame img');
  return {w: Math.round(i.getBoundingClientRect().width), left: Math.round(parseFloat(i.style.left))};
});
console.log('zoomed image box:', JSON.stringify(framed));
await p.locator('#cSave').click(); await p.waitForTimeout(1200);
console.log('compact saved:', JSON.stringify(await blobs()));
console.log('dimensions (square?):', await dims());

// 4. rotate then save at High, on a second species
await openPicker('lilac-breasted');
await p.setInputFiles('#filePick', [SP+'roller.png']);
await p.locator('.cropper').waitFor({state:'visible'});
const before = await p.evaluate(() => document.querySelector('.crop-frame img').naturalWidth);
await p.locator('#cRotate').click(); await p.waitForTimeout(900);
const after = await p.evaluate(() => document.querySelector('.crop-frame img').naturalWidth);
console.log('rotate swapped axes:', before, '->', after);
await p.locator('#cSize button').nth(2).click();           // High
await p.locator('#cSave').click(); await p.waitForTimeout(1500);
const all = await blobs();
console.log('two photos now:', all.length, '| sizes:', all.map(x=>x.full).join(', '));
console.log('dimensions:', await dims());

// 5. the size choice is remembered for next time
await p.reload(); await p.waitForTimeout(1100);
await openPicker('kudu');
await p.setInputFiles('#filePick', [SP+'leopard.png']);
await p.locator('.cropper').waitFor({state:'visible'});
console.log('remembered size:', (await p.locator('#cSize button[aria-pressed="true"]').textContent()).split('px')[0]);
await p.locator('#cCancel').click(); await p.waitForTimeout(300);

console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
