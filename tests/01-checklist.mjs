import { chromium } from 'playwright';
import path from 'path';

const errors = [];
const browser = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await browser.newContext({ viewport:{width:412,height:915}, deviceScaleFactor:2 });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if(m.type()==='error') errors.push('CONSOLE: ' + m.text()); });

await page.goto('file://' + path.resolve('index.html'));
await page.waitForTimeout(1200);

const stats = await page.evaluate(() => ({
  total: document.querySelector('#tallyTot').textContent,
  seen: document.querySelector('#tallySeen').textContent,
  rows: document.querySelectorAll('.row').length,
  groups: [...document.querySelectorAll('.grouphead')].map(h => h.querySelector('h2').textContent + ' ' + h.querySelector('.gcount').textContent),
  chips: [...document.querySelectorAll('.chip')].map(c => c.textContent.trim()),
  railSegs: document.querySelectorAll('.rail-seg').length,
  fontLoaded: document.fonts.check('700 16px Archivo')
}));
console.log('BOOT', JSON.stringify(stats, null, 1));

// duplicate id check
const dupes = await page.evaluate(() => {
  const ids = {}; const out = [];
  document.querySelectorAll('.row .rname').forEach(n => {});
  return out;
});

// tick a species, verify counter + persistence
await page.locator('.row').first().click();
await page.waitForTimeout(300);
const sheetName = await page.locator('#sheetName').textContent();
await page.locator('#btnSeen').click();
await page.waitForTimeout(400);
await page.locator('#sheetBack').click();
await page.waitForTimeout(300);
const afterTick = await page.evaluate(() => document.querySelector('#tallySeen').textContent);

// notes persistence
await page.locator('.row').first().click();
await page.waitForTimeout(250);
await page.fill('#fPlace','S100 loop');
await page.fill('#fNotes','Big male, sleeping under a marula.');
await page.waitForTimeout(700);
await page.locator('#sheetBack').click();
await page.waitForTimeout(200);

await page.reload();
await page.waitForTimeout(1200);
const afterReload = await page.evaluate(() => document.querySelector('#tallySeen').textContent);
const persisted = await page.evaluate(async () => {
  const r = await new Promise(res => { const q = indexedDB.open('kruger-life-list'); q.onsuccess = () => { const t = q.result.transaction('log').objectStore('log').getAll(); t.onsuccess = () => res(t.result); }; });
  return r;
});
console.log('TICK', sheetName, '| after tick:', afterTick, '| after reload:', afterReload);
console.log('PERSISTED', JSON.stringify(persisted));

// search + filters
await page.fill('#search','pangolin');
await page.waitForTimeout(400);
console.log('SEARCH pangolin ->', await page.evaluate(() => [...document.querySelectorAll('.rname')].map(n=>n.textContent)));
await page.fill('#search','');
await page.waitForTimeout(300);
await page.locator('[data-status="todo"]').click();
await page.waitForTimeout(400);
console.log('TODO note ->', await page.textContent('#countNote'));
await page.locator('[data-status="all"]').click();
await page.selectOption('#sort','rarity');
await page.waitForTimeout(400);
console.log('HARDEST FIRST ->', await page.evaluate(() => [...document.querySelectorAll('.rname')].slice(0,4).map(n=>n.textContent)));
await page.selectOption('#sort','taxo');
await page.waitForTimeout(300);

// collections + progress
await page.locator('#tab-coll').click(); await page.waitForTimeout(500);
console.log('COLLECTIONS ->', await page.evaluate(() => [...document.querySelectorAll('.collcard')].map(c => c.querySelector('h3').textContent + ' ' + c.querySelector('.cdone').textContent + ' (' + c.querySelectorAll('.colllist button').length + ')')));
await page.screenshot({path:'/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/shot-coll.png', fullPage:false});
await page.locator('#tab-prog').click(); await page.waitForTimeout(600);
console.log('STATS ->', await page.evaluate(() => [...document.querySelectorAll('.stat')].map(s => s.querySelector('.stat-k').textContent + ': ' + s.querySelector('.stat-v').textContent)));
await page.screenshot({path:'/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/shot-prog.png'});
await page.locator('#tab-list').click(); await page.waitForTimeout(400);
await page.screenshot({path:'/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/shot-dark.png'});

// light theme
await page.evaluate(() => document.documentElement.setAttribute('data-theme','light'));
await page.waitForTimeout(300);
await page.screenshot({path:'/tmp/claude-0/-home-user-repo-1/3c16819a-aecb-5400-84c7-ad78ecf06ab8/scratchpad/shot-light.png'});

// horizontal overflow check
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log('H-OVERFLOW px:', overflow);

console.log('ERRORS:', errors.length ? errors : 'none');
await browser.close();
