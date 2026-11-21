/* Run with Playwright installed: npm install --no-save playwright@1.65.1
   npx playwright install chromium && node browser-smoke.cjs
   All customer data and Supabase responses below are synthetic. No live DB calls. */
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;
const state={subject:'رياضيات',stage:'ثانوية عامة',price:300,since:'2026-10',groups:[{id:'g1',days:[0,3],t:'17:00',e:'19:00',students:[{id:'s1',name:'طالب تجريبي',phone:'',since:'2026-10'},{id:'s2',name:'طالبة تجريبية',phone:'',since:'2026-10'}]}],att:{},pay:{'2026-10':{s1:true}},exams:[]};
const sdk='window.testDb='+JSON.stringify({state,updated_at:'2026-11-21T20:00:00Z'})+';('+function(){
  window.writes=[];
  window.supabase={createClient(){
    return {
      auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'test-teacher',email:'teacher@example.test'}}}}),signOut:async()=>({error:null})},
      from(table){
        return {
          op:'select',filters:[],
          select(){if(this.op==='select')return this;if(window.forceConflict)return Promise.resolve({data:[],error:null});window.testDb=structuredClone(this.row);window.writes.push(structuredClone(this.row));return Promise.resolve({data:[{updated_at:this.row.updated_at}],error:null})},
          eq(k,v){this.filters.push([k,v]);return this},is(k,v){return this.eq(k,v)},
          maybeSingle(){return Promise.resolve({data:table==='subscriptions'?{paid_until:'2099-01-01'}:window.testDb,error:null})},
          update(row){this.op='update';this.row=row;return this},insert(row){this.op='insert';this.row=row;return this}
        };
      }
    };
  }};
}.toString()+')();';
(async()=>{
  const server=http.createServer((req,res)=>{const file=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','core.js','app.js'].includes(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,file)))});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Africa/Cairo'});const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  const base='http://127.0.0.1:'+server.address().port;
  await page.route('**/*',route=>{const url=route.request().url();if(url.includes('cdn.jsdelivr.net/npm/@supabase/'))return route.fulfill({contentType:'application/javascript',body:sdk});if(url.startsWith(base))return route.continue();return route.abort()});
  try{
    await page.goto(base);await page.getByRole('tab',{name:'الطلاب',exact:true}).click();await page.getByRole('button',{name:'الملف',exact:true}).first().click();
    await page.locator('textarea[data-f="note"]').fill('ملاحظة اختبار محفوظة');await page.locator('textarea[data-f="note"]').blur();
    await page.waitForFunction(()=>window.testDb.state.groups[0].students[0].note==='ملاحظة اختبار محفوظة');
    await page.getByRole('tab',{name:'الرئيسية',exact:true}).click();await page.getByRole('tab',{name:'الطلاب',exact:true}).click();assert.equal(await page.locator('textarea[data-f="note"]').inputValue(),'ملاحظة اختبار محفوظة');
    await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-student-mobile.png'):'/tmp/ostazy-student-mobile.png',fullPage:true});
    await page.getByRole('tab',{name:'المصاريف',exact:true}).click();await page.getByRole('button',{name:'تم الدفع',exact:true}).first().click();
    await page.waitForFunction(()=>window.testDb.state.paymentLedger?.length===1);assert.equal(await page.evaluate(()=>window.testDb.state.paymentLedger[0].amount),300);
    const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'نسخة احتياطية',exact:true}).click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/^ostazy-backup-/);
    const saved=await page.evaluate(()=>window.testDb.state);await page.locator('#restorePick').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('تم حفظ كل'));
    // Real DOM behavior for a failed optimistic write: preserve local work and stop editing.
    await page.getByRole('tab',{name:'المصاريف',exact:true}).click();await page.evaluate(()=>window.forceConflict=true);await page.getByRole('button',{name:'تم الدفع',exact:true}).first().click();await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('توقف الحفظ'));
    const before=await page.evaluate(()=>window.writes.length);await page.getByRole('button',{name:'إلغاء',exact:true}).first().click();assert.equal(await page.evaluate(()=>window.writes.length),before);
    await page.setViewportSize({width:1280,height:900});await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-conflict-desktop.png'):'/tmp/ostazy-conflict-desktop.png',fullPage:true});
    assert.deepEqual(errors,[]);console.log('PASS: mobile profile persistence, receipt capture, export, restore, conflict lock, desktop render; no browser exceptions.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
