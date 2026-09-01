import { chromium } from 'playwright';
const errs=[];
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport:{width:412,height:915}});
const p = await ctx.newPage();
p.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
p.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
p.on('requestfailed', r => errs.push('REQFAIL: '+r.url().slice(0,70)+' '+(r.failure()?.errorText)));
await p.goto('http://127.0.0.1:8899/index.html');
await p.waitForTimeout(2500);
console.log('total species:', await p.textContent('#tallyTot'));
console.log('SW registered:', await p.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length)));
const man = await p.evaluate(async () => (await fetch('manifest.webmanifest')).json());
console.log('manifest:', man.name, '|', man.display, '| icons:', man.icons.length);

// tick something, then go fully offline and reload — the Kruger scenario
await p.locator('.row').first().click(); await p.waitForTimeout(300);
await p.locator('#btnSeen').click(); await p.waitForTimeout(400);
await p.locator('#sheetBack').click(); await p.waitForTimeout(300);
await ctx.setOffline(true);
await p.reload();
await p.waitForTimeout(2000);
console.log('OFFLINE reload -> total:', await p.textContent('#tallyTot'), '| logged:', await p.textContent('#tallySeen'));
console.log('OFFLINE rows rendered:', await p.locator('.row').count());
// can we still tick while offline?
await p.locator('.row').nth(2).click(); await p.waitForTimeout(300);
await p.locator('#btnSeen').click(); await p.waitForTimeout(400);
await p.locator('#sheetBack').click(); await p.waitForTimeout(300);
console.log('OFFLINE tick works -> logged:', await p.textContent('#tallySeen'));
await ctx.setOffline(false);
console.log('ERRORS:', errs.length ? errs : 'none');
await b.close();
