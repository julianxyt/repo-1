import { chromium } from 'playwright';
const errs=[];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
// grant durable storage the way an installed PWA would get it
const ctx = await b.newContext({viewport:{width:412,height:915}, permissions:['notifications']});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
await p.goto('http://127.0.0.1:8899/index.html');
await p.waitForTimeout(1500);

console.log('persist() available:', await p.evaluate(() => !!(navigator.storage && navigator.storage.persist)));
console.log('persisted after boot:', await p.evaluate(() => navigator.storage.persisted()));
const est = await p.evaluate(() => navigator.storage.estimate());
console.log('quota MB:', Math.round(est.quota/1048576), '| usage bytes:', est.usage);

// menu readout, empty state
await p.locator('#menuBtn').click(); await p.waitForTimeout(700);
console.log('MENU (empty):', (await p.textContent('#mStorage')).slice(0,150));
console.log('menu line class:', await p.getAttribute('#mStorage','class'));
await p.locator('#mClose').click(); await p.waitForTimeout(200);

// add real data, re-read
await p.evaluate(async () => {
  for(let i=0;i<8;i++) await window.__putLog({id:'mam-lion'+i, seen:true, ts:Date.now(), date:'2026-08-30', place:'Satara', notes:'', photos:[]});
  await window.__reload(); window.__refresh();
});
await p.waitForTimeout(400);
await p.locator('#menuBtn').click(); await p.waitForTimeout(700);
console.log('MENU (with data):', (await p.textContent('#mStorage')).slice(0,160));
await p.screenshot({path:'/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/menu.png'});

// private-mode style failure: report must degrade, not throw
const r = await p.evaluate(() => window.__storageReport());
console.log('report object:', JSON.stringify(r));
console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
