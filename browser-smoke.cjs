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
      auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:window.testUid||'test-teacher',email:'teacher@example.test'}}}}),signOut:async()=>({error:null})},
      rpc(name,params){window.rpcCalls=window.rpcCalls||[];window.rpcCalls.push([name,params]);if(name==='admin_list_subscriptions')return Promise.resolve({data:structuredClone(window.adminRows||[]),error:null});if(name==='admin_set_paid_until'){const r=(window.adminRows||[]).find(x=>x.user_id===params.target);if(r)r.paid_until=params.until;return Promise.resolve({data:null,error:null})}return Promise.resolve({data:null,error:{message:'unknown rpc'}});},
      from(table){
        return {
          op:'select',filters:[],
          select(){if(this.op==='select')return this;if(window.forceConflict)return Promise.resolve({data:[],error:null});window.testDb=structuredClone(this.row);window.writes.push(structuredClone(this.row));return Promise.resolve({data:[{updated_at:this.row.updated_at}],error:null})},
          eq(k,v){this.filters.push([k,v]);return this},is(k,v){return this.eq(k,v)},
          maybeSingle(){return Promise.resolve({data:structuredClone(table==='subscriptions'?{paid_until:'2099-01-01'}:window.testDb),error:null})},
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
    await page.goto(base);
    assert.ok(await page.evaluate(()=>document.getElementById('syncTools').classList.contains('hide')),'syncTools must stay hidden in the normal state');
    assert.ok(await page.locator('#btabs').isVisible(),'mobile bottom nav must be visible');
    assert.ok(!(await page.locator('#tabs').isVisible()),'desktop sidebar strip must stay hidden on mobile');
    await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-home-mobile.png'):'/tmp/ostazy-home-mobile.png',fullPage:true});await page.getByRole('tab',{name:'الطلاب',exact:true}).click();await page.getByRole('button',{name:'الملف',exact:true}).first().click();
    await page.locator('textarea[data-f="note"]').fill('ملاحظة اختبار محفوظة');await page.locator('textarea[data-f="note"]').blur();
    await page.waitForFunction(()=>window.testDb.state.groups[0].students[0].note==='ملاحظة اختبار محفوظة' && document.getElementById('sync').textContent.includes('تم حفظ كل'));
    assert.ok(await page.evaluate(()=>window.writes.length>0));
    await page.getByRole('tab',{name:'الرئيسية',exact:true}).click();await page.getByRole('tab',{name:'الطلاب',exact:true}).click();assert.equal(await page.locator('textarea[data-f="note"]').inputValue(),'ملاحظة اختبار محفوظة');
    await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-student-mobile.png'):'/tmp/ostazy-student-mobile.png',fullPage:true});
    await page.getByRole('tab',{name:'المصاريف',exact:true}).click();await page.getByRole('button',{name:'تم الدفع',exact:true}).first().click();
    await page.waitForFunction(()=>window.testDb.state.paymentLedger?.length===1);assert.equal(await page.evaluate(()=>window.testDb.state.paymentLedger[0].amount),300);
    await page.getByRole('button',{name:'المزيد',exact:true}).click();assert.ok(await page.locator('#sheet').isVisible(),'المزيد sheet must open on mobile');
    await page.getByRole('tab',{name:'النسخ الاحتياطي',exact:true}).click();assert.ok(!(await page.locator('#sheet').isVisible()),'المزيد sheet must close after choosing a section');
    await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-backup-mobile.png'):'/tmp/ostazy-backup-mobile.png',fullPage:true});
    const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'تنزيل نسخة احتياطية',exact:true}).click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/^ostazy-backup-/);
    assert.ok(await page.evaluate(()=>{const r=document.getElementById('restorePick').getBoundingClientRect();return r.width<=1&&r.height<=1}),'native file input must be clipped out of view');
    assert.ok(await page.locator('#view').getByRole('button',{name:'اختيار ملف النسخة',exact:true}).isVisible(),'styled picker button must be visible');
    await page.locator('#restorePick').setInputFiles({name:'big-backup.json',mimeType:'application/json',buffer:Buffer.alloc(5*1024*1024+1,48)});
    await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('لم تتم الاستعادة'));
    assert.equal(await page.locator('#restoreName').textContent(),'big-backup.json','selected filename must show next to the picker');
    const saved=await page.evaluate(()=>window.testDb.state);await page.locator('#restorePick').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('تم حفظ كل'));
    // Real DOM behavior for a failed optimistic write: preserve local work and stop editing.
    await page.getByRole('tab',{name:'المصاريف',exact:true}).click();await page.evaluate(()=>window.forceConflict=true);await page.getByRole('button',{name:'تم الدفع',exact:true}).first().click();await page.waitForFunction(()=>document.getElementById('sync').textContent.includes('توقف الحفظ'));
    assert.ok(await page.evaluate(()=>!document.getElementById('syncTools').classList.contains('hide')),'syncTools must surface when saving is blocked');
    const before=await page.evaluate(()=>window.writes.length);await page.getByRole('button',{name:'إلغاء',exact:true}).first().click();assert.equal(await page.evaluate(()=>window.writes.length),before);
    await page.getByRole('button',{name:'المزيد',exact:true}).click();await page.getByRole('tab',{name:'النسخ الاحتياطي',exact:true}).click();assert.ok(await page.locator('#view').getByRole('button',{name:'إعادة تحميل البيانات',exact:true}).isVisible());
    await page.setViewportSize({width:1280,height:900});
    assert.ok(await page.locator('#tabs').isVisible(),'desktop sidebar must be visible on desktop');
    assert.ok(!(await page.locator('#btabs').isVisible()),'mobile bottom nav must stay hidden on desktop');await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-conflict-desktop.png'):'/tmp/ostazy-conflict-desktop.png',fullPage:true});
    await page.getByRole('tab',{name:'النسخ الاحتياطي',exact:true}).click();await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-backup-desktop.png'):'/tmp/ostazy-backup-desktop.png',fullPage:true});
    assert.equal(await page.getByRole('tab',{name:'الإدارة',exact:true}).count(),0,'admin tab must stay hidden for non-admin accounts');
    await page.evaluate(()=>{window.testUid='1196d2ad-0eb9-4c81-a3e0-657c13d05a67';window.adminRows=[{user_id:'u2',email:'teacher2@example.test',trial_ends:'2026-01-01T00:00:00Z',paid_until:null}];window.rpcCalls=[];uid=null;init();});
    await page.waitForSelector('#tabs button[data-t="m"]');
    await page.getByRole('tab',{name:'الإدارة',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('view').innerText.includes('teacher2@example.test'));
    assert.ok(await page.evaluate(()=>document.getElementById('view').innerText.includes('منتهي')),'expired teacher must show منتهي');
    assert.ok(await page.evaluate(()=>window.rpcCalls.some(c=>c[0]==='admin_list_subscriptions')),'admin list rpc must be called');
    await page.getByRole('button',{name:'تجديد شهر',exact:true}).click();
    await page.waitForFunction(()=>window.rpcCalls.some(c=>c[0]==='admin_set_paid_until'&&c[1].target==='u2'&&Date.parse(c[1].until)>Date.now()),'renewal must call admin_set_paid_until with a future date');
    await page.waitForFunction(()=>document.getElementById('view').innerText.includes('ساري'),'renewed teacher must show ساري');
    await page.setViewportSize({width:390,height:844});await page.waitForSelector('#btabs button');
    await page.screenshot({path:process.env.OSTAZY_SCREENSHOT_DIR?path.join(process.env.OSTAZY_SCREENSHOT_DIR,'ostazy-admin-mobile.png'):'/tmp/ostazy-admin-mobile.png',fullPage:false});
    assert.deepEqual(errors,[]);console.log('PASS: mobile profile persistence, receipt capture, export, restore, conflict lock, desktop render; mobile bottom nav + المزيد sheet, desktop sidebar, admin subscription screen authorization flow; no browser exceptions.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
