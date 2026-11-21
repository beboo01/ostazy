const DAYS=["السبت","الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];
const STAGES=["ابتدائي","إعدادي","ثانوية عامة","جامعي"];
const TABS=[["h","الرئيسية"],["g","المجموعات"],["s","الطلاب"],["a","الحضور"],["p","المصاريف"],["e","الدرجات"],["r","التقارير"],["b","النسخ الاحتياطي"]];
const TL=Object.fromEntries(TABS),BMAIN=["h","a","p","s"],BMORE=["g","e","r","b"];
const ICG=(p,s)=>`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const TICON={h:ICG('<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>'),g:ICG('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 5a3 3 0 0 1 0 6"/><path d="M17.5 14.4c2.4.7 4 2.7 4 5.6"/>'),s:ICG('<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11.2V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8"/>'),a:ICG('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),p:ICG('<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>'),e:ICG('<path d="M4 20V10M10 20V4M16 20v-7"/><path d="M2.5 20h19"/>'),r:ICG('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),b:ICG('<path d="M12 3v11"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/>')};
const IC_MORE=ICG('<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>');
const DEMO=["أحمد","مريم","يوسف","سلمى"];
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const C=OstazyCore;
const rid=()=>crypto.randomUUID();
const today=()=>C.localDate();
const fmt=t=>{const[h,m]=t.split(":").map(Number);return(h%12||12)+(m?":"+String(m).padStart(2,"0"):"")+(h>=12?" م":" ص")};
const mname=m=>new Date(m+"-01").toLocaleDateString("ar-EG",{month:"long",year:"numeric"});
const num=v=>Number(String(v).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)))||0;
const phone=p=>{let d=String(p||"").replace(/\D/g,"");if(d.startsWith("00"))d=d.slice(2);else if(d.startsWith("0"))d="20"+d.slice(1);return d};
const wa=(p,m)=>"https://wa.me/"+phone(p)+"?text="+encodeURIComponent(m);
const A=(p,m,t)=>'<a class="wa" target="_blank" rel="noopener" href="'+wa(p,m)+'">'+t+'</a>';
const gname=g=>"مجموعة "+(g.days||[g.d||0]).slice().sort((a,b)=>a-b).map(d=>DAYS[d]).join(" + ")+" "+fmt(g.t)+(g.e?" – "+fmt(g.e):"");
const W={step:0,subject:"رياضيات",stage:"ثانوية عامة",n:2,slots:[{days:[0,3],t:"17:00",e:"19:00"},{days:[1,4],t:"19:00",e:"21:00"},{days:[2,5],t:"16:00",e:"18:00"},{days:[0,3],t:"19:00",e:"21:00"}],price:300,demo:false};
let S=null,store=null,tab="h",gi=0,adate=today(),pmonth=today().slice(0,7),rmonth=today().slice(0,7),pt;
let moreOpen=false;

const SB_URL="https://dgktjcjvhhhtcucqsrji.supabase.co",SB_KEY="sb_publishable_wFdMsflUtKeSeby-_m4snw_KNEI7her";
if(!window.supabase){document.getElementById("sync").textContent="تعذّر تحميل خدمة الدخول. افحص الاتصال ثم أعد تحميل الصفحة.";throw new Error("Supabase SDK unavailable")}
const sb=window.supabase.createClient(SB_URL,SB_KEY);let uid=null,SUB=null,EMAIL="";
const ADMIN_WA="201016229014",PAY_NUM="01016229014",PRICE=150; // ضع رقم واتساب الدفع هنا بالصيغة الدولية، مثال: 201012345678
const amsg=t=>{$("amsg").textContent=t};
let remoteVersion=null,hasRemoteRow=false,dirty=false,saving=false,savePromise=null,editRevision=0,saveBlocked=false,loadFailed=false;
const status=t=>{$("sync").textContent=t};
function downloadBackup(){if(!S)return;const u=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:"application/json"})),link=document.createElement("a");link.href=u;link.download="ostazy-backup-"+today()+".json";link.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
async function init(){
  try{const{data}=await sb.auth.getSession();if(data.session){uid=data.session.user.id;EMAIL=data.session.user.email||"";await load();return}}catch(e){}
  $("auth").classList.remove("hide");
}
async function load(){
  $("auth").classList.add("hide");$("wiz").classList.add("hide");$("app").classList.add("hide");$("syncTools").classList.add("hide");
  status("جاري تحميل بياناتك...");loadFailed=false;saveBlocked=false;SUB=null;
  try{
    const {data,error}=await sb.from("teacher_state").select("state,updated_at").eq("user_id",uid).maybeSingle();
    if(error)throw error;
    hasRemoteRow=!!data;remoteVersion=data?.updated_at??null;
    S=data?.state||null;
    if(S)C.validateState(S);
    // Never copy unscoped legacy localStorage into a signed-in account automatically.
  }catch(e){loadFailed=true;$("syncTools").classList.remove("hide");status("تعذّر تحميل البيانات بأمان. لن يتم إنشاء بيانات جديدة فوقها. أعد المحاولة، أو نزّل نسخة للدعم. "+(e.message||e));return}
  dirty=false;editRevision=0;
  try{
    const {data,error}=await sb.from("subscriptions").select("trial_ends,paid_until").eq("user_id",uid).maybeSingle();
    if(error)throw error;
    SUB=data||null;
    status(SUB?"تم تحميل بياناتك.":"لم نتمكن من التحقق من اشتراكك. التعديل متوقف، تواصل مع الدعم.");
  }catch(e){status("تعذّر التحقق من الاشتراك. بياناتك متاحة للقراءة والنسخ الاحتياطي فقط.")}
  $("stor").textContent="الحفظ على حسابك. لا تغلق الصفحة قبل ظهور تأكيد الحفظ.";
  if(S){$("app").classList.remove("hide");render()}else{$("wiz").classList.remove("hide");wizard()}
}
async function save2(){
  clearTimeout(pt);
  if(saving)return savePromise;
  if(!dirty||saveBlocked||loadFailed)return !dirty;
  saving=true;
  savePromise=(async()=>{
    try{
      while(dirty&&!saveBlocked){
        const revision=editRevision,snapshot=JSON.parse(JSON.stringify(S));C.validateState(snapshot);
        const stamp=new Date(Math.max(Date.now(),Date.parse(remoteVersion||0)+1||0)).toISOString();
        const row={user_id:uid,state:snapshot,updated_at:stamp};
        let query;
        if(hasRemoteRow){query=sb.from("teacher_state").update(row).eq("user_id",uid);query=remoteVersion===null?query.is("updated_at",null):query.eq("updated_at",remoteVersion)}
        else query=sb.from("teacher_state").insert(row);
        const {data,error}=await query.select("updated_at");
        if(error){if(error.code==="23505")saveBlocked=true;throw error}
        if(!data||data.length!==1){saveBlocked=true;throw new Error("تعارض نسخة أو رفض صلاحية الحفظ")}
        hasRemoteRow=true;remoteVersion=data[0].updated_at??stamp;
        dirty=editRevision!==revision;
      }
      $("syncTools").classList.add("hide");status("تم حفظ كل التغييرات على حسابك.");return true;
    }catch(e){$("syncTools").classList.remove("hide");status((saveBlocked?"توقف الحفظ لحماية بياناتك من الكتابة فوق نسخة أحدث. نزّل نسختك أولًا ثم أعد التحميل. ":"لم يتم الحفظ. تغييراتك موجودة في الصفحة فقط. جرّب الحفظ أو نزّل نسخة قبل الإغلاق. ")+(e.message||e));return false}
    finally{saving=false}
  })();
  return savePromise;
}
function persist(){dirty=true;editRevision++;status("تغييرات لم تُحفظ بعد...");clearTimeout(pt);pt=setTimeout(save2,500)}
$("retrySave").onclick=()=>save2();
$("reloadData").onclick=()=>{if(dirty&&!confirm("يوجد تعديل غير محفوظ. نزّل نسخة احتياطية أولًا. هل تريد تجاهله وتحميل النسخة المحفوظة؟"))return;clearTimeout(pt);if(saving){status("انتظر اكتمال محاولة الحفظ أولًا.");return}load()};
$("downloadAll").onclick=downloadBackup;
async function restoreFile(input){
 const file=input.files[0];input.value="";if(!file)return;
 const rn=$("restoreName");if(rn)rn.textContent=file.name;
 if(!active()){flash();return}
 try{if(file.size>5*1024*1024)throw new Error("حجم النسخة أكبر من 5 ميجابايت");const restored=C.parseBackup(await file.text());
 if(!confirm("الاستعادة ستستبدل بيانات الحساب الحالية بعد الحفظ. سيتم تنزيل نسخة من البيانات الحالية أولًا. هل أنت متأكد؟"))return;
 downloadBackup();S=restored;gi=0;sid=null;tab="h";persist();$("wiz").classList.add("hide");$("app").classList.remove("hide");render();
 }catch(error){status("لم تتم الاستعادة: "+error.message)}
}
window.addEventListener("beforeunload",event=>{if(dirty||saving){event.preventDefault();event.returnValue=""}});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&dirty&&!saving)save2()});
async function authGo(up){
  const email=$("aem").value.trim(),password=$("apw").value;
  if(!email||password.length<6){amsg("اكتب الإيميل وباسورد 6 حروف على الأقل.");return}
  amsg("لحظة...");
  const r=up?await sb.auth.signUp({email,password}):await sb.auth.signInWithPassword({email,password});
  if(r.error){amsg(r.error.message);return}
  if(!r.data.session){amsg("تم إنشاء الحساب. افتح إيميلك واضغط رابط التأكيد، وبعدها ادخل.");return}
  uid=r.data.session.user.id;EMAIL=r.data.session.user.email||"";await load();
}
$("li").onclick=()=>authGo(false);$("su").onclick=()=>authGo(true);
$("out").onclick=async()=>{if(dirty&&!(await save2()))return;const {error}=await sb.auth.signOut();if(error){status(error.message);return}location.reload()};

const active=()=>!loadFailed&&!saveBlocked&&C.isActive(SUB);
function waSub(){if(!ADMIN_WA)return'<span class="tag bad">رقم الدفع لسه متحددش</span>';return A(ADMIN_WA,"السلام عليكم، أنا عايز أشترك في «أستاذي لإدارة المجموعات» ("+PRICE+" جنيه في الشهر). إيميل حسابي: "+EMAIL+". ابعتلي طريقة الدفع لو سمحت.","اشترك عن طريق واتساب")}
function billHtml(){
  if(!SUB)return '<div class="card"><p>الاشتراك غير مؤكد. القراءة والنسخ الاحتياطي متاحان، والتعديل متوقف.</p>'+waSub()+'</div>';
  const n=Date.now(),te=new Date(SUB.trial_ends).getTime(),pu=SUB.paid_until?new Date(SUB.paid_until).getTime():0,df=t=>Math.max(0,Math.ceil((t-n)/864e5)),l=waSub();
  if(pu>n)return'<div class="card"><span class="tag ok">اشتراكك ساري</span> لحد '+new Date(pu).toLocaleDateString("ar-EG")+(df(pu)<=5?' (باقي '+df(pu)+' أيام) '+l+payBox():'')+'</div>';
  if(te>n)return'<div class="card"><span class="tag warn">تجربة مجانية</span> باقي '+df(te)+' يوم. '+l+payBox()+'</div>';
  return'<div class="card" style="border-color:var(--bad)"><h2>انتهت فترة الاستخدام</h2><p>بياناتك محفوظة وتقدر تشوفها وتنزّل نسخة احتياطية، لكن التعديل متوقف لحد ما تشترك ('+PRICE+' جنيه في الشهر).</p>'+l+payBox()+'</div>'}
const IC_BOLT='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',IC_WAL='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/></svg>';
function payBox(){return'<div class="pay"><b>طرق الدفع</b><div class="btns" style="margin:6px 0"><span class="pm">'+IC_BOLT+' إنستا باي</span><span class="pm">'+IC_WAL+' فودافون كاش</span></div><div>حوّل <b>'+PRICE+' جنيه</b> على الرقم <b dir="ltr">'+PAY_NUM+'</b> <button class="ghost sm" type="button" data-copy="'+PAY_NUM+'">نسخ الرقم</button></div><small style="color:var(--mute)">بعد التحويل ابعت صورة الإيصال على واتساب وهنفعّل حسابك.</small></div>'}
$("bill").onclick=e=>{const b=e.target.closest("button[data-copy]");if(b&&navigator.clipboard)navigator.clipboard.writeText(b.dataset.copy).then(()=>{b.textContent="تم النسخ"}).catch(()=>{})};
function flash(){status(saveBlocked?"الحفظ متوقف بسبب تعارض. نزّل نسخة ثم أعد تحميل البيانات.":"التعديل متوقف. تأكد من الاشتراك واتصال الحساب أولًا.")}
function dayChips(pre,sel){return'<div class="chips">'+DAYS.map((d,j)=>'<label class="chip"><input type="checkbox" data-day="'+pre+'" value="'+j+'"'+(sel.includes(j)?' checked':'')+'> '+d+'</label>').join("")+'</div>'}
function getDays(pre){return[...document.querySelectorAll('input[data-day="'+pre+'"]:checked')].map(x=>+x.value)}
function wizard(){
  $("back").style.visibility=W.step?"visible":"hidden";
  $("next").textContent=W.step==2?"جهّز مجموعاتي":"التالي";
  const t=$("wt"),b=$("wb");
  if(W.step==0){t.textContent="بتدرّس إيه؟";b.innerHTML='<label for="subj">المادة</label><input id="subj" value="'+esc(W.subject)+'"><label for="stg">المرحلة</label><select id="stg">'+STAGES.map(x=>'<option'+(x==W.stage?' selected':'')+'>'+x+'</option>').join("")+'</select>'}
  else if(W.step==1){t.textContent="عندك كام مجموعة؟";
    while(W.slots.length<W.n)W.slots.push({days:[W.slots.length%7,(W.slots.length+3)%7],t:"17:00",e:"19:00"});
    let h='<label for="cnt">عدد المجموعات</label><select id="cnt">'+Array.from({length:12},(_,k)=>k+1).map(x=>'<option'+(x==W.n?' selected':'')+'>'+x+'</option>').join("")+'</select>';
    for(let i=0;i<W.n;i++)h+='<div class="card" style="margin:10px 0"><b>المجموعة '+(i+1)+' (اختار الأيام)</b>'+dayChips("w"+i,W.slots[i].days)+'<div class="row" style="margin-top:6px"><div>من<input id="h'+i+'" type="time" value="'+W.slots[i].t+'"></div><div>إلى<input id="e'+i+'" type="time" value="'+(W.slots[i].e||"")+'"></div></div></div>';
    b.innerHTML=h;$("cnt").onchange=e=>{wsave();W.n=+e.target.value;wizard()}}
  else{t.textContent="سعر الشهر للطالب";b.innerHTML='<label for="pr">بالجنيه</label><input id="pr" type="number" min="0" step="10" value="'+W.price+'"><label><input type="checkbox" id="demo" style="width:auto"> أضف طلاب تجريبيين عشان أجرّب</label>'}
}
function wsave(){
  if(W.step==0){W.subject=$("subj").value.trim()||"المادة";W.stage=$("stg").value}
  else if(W.step==1)for(let i=0;i<W.n;i++){const ds=getDays("w"+i);W.slots[i]={days:ds.length?ds:[0],t:$("h"+i).value||"17:00",e:$("e"+i).value||""}}
  else{W.price=num($("pr").value);W.demo=$("demo").checked}
}
$("next").onclick=()=>{
  if(!active()){flash();return}wsave();if(W.step<2){W.step++;wizard();return}
  const m=today().slice(0,7);
  S={subject:W.subject,stage:W.stage,price:W.price,since:m,groups:W.slots.slice(0,W.n).map((s,i)=>({id:rid(),days:s.days,t:s.t,e:s.e,notify:false,students:W.demo?DEMO.map((n,j)=>({id:rid(),name:n,phone:"2010000000"+i+j,since:m})):[]})),att:{},pay:{},exams:[]};
  gi=0;tab="h";persist();$("wiz").classList.add("hide");$("app").classList.remove("hide");render();
};
$("back").onclick=()=>{wsave();W.step--;wizard()};

const allSt=()=>S.groups.flatMap(g=>g.students.map(s=>({...s,g})));
const paid=(m,id)=>!!(S.pay[m]&&S.pay[m][id]);
const monthsFrom=(a,b)=>{const r=[];let[y,m]=a.split("-").map(Number);const[y2,m2]=b.split("-").map(Number);while(y<y2||(y==y2&&m<=m2)){r.push(y+"-"+String(m).padStart(2,"0"));if(++m>12){m=1;y++}}return r};
const overdue=s=>monthsFrom(s.since||S.since,today().slice(0,7)).slice(0,-1).filter(m=>!paid(m,s.id));
function monthAtt(sid,m){let p=0,x=0;for(const k in S.att){if(k.slice(0,7)!=m)continue;const v=S.att[k][sid];if(v===true)p++;else if(v===false)x++}return{p,x}}
function monthExam(sid,m){const r=S.exams.filter(e=>e.date.slice(0,7)==m&&e.scores[sid]!=null&&e.scores[sid]!=="");return r.length?Math.round(r.reduce((a,e)=>a+e.scores[sid]/e.max*100,0)/r.length):null}

let sid=null;
const findSt=id=>C.findStudent(S,id);
const sm=m=>new Date(m+"-01").toLocaleDateString("ar-EG",{month:"short"});
const months6=()=>C.recentMonths();
const totals=m=>C.monthlyTotals(S,m);
const income=m=>{const t=totals(m);return t.amount+" جنيه"+(t.legacyCount?" + "+t.legacyCount+" دفعات قديمة بدون مبلغ مسجل":"")};
function bars(vals,labels,suf){const mx=Math.max(1,...vals.map(v=>v||0)),w=60;return'<svg viewBox="0 0 '+(labels.length*w)+' 140" style="width:100%;height:auto" role="img">'+vals.map((v,i)=>{const hh=Math.round((v||0)/mx*85),cx=i*w+30;return'<rect x="'+(cx-18)+'" y="'+(104-hh)+'" width="36" height="'+hh+'" rx="4" fill="var(--acc)"/><text x="'+cx+'" y="'+(98-hh)+'" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">'+(v==null?"—":v+(suf||""))+'</text><text x="'+cx+'" y="124" text-anchor="middle" font-size="11" fill="var(--mute)">'+esc(labels[i])+'</text>'}).join("")+'</svg>'}
function render(){
  $("bill").innerHTML=billHtml();
  S.groups.forEach(g=>{if(!g.days)g.days=[g.d||0];if(g.e===undefined)g.e=""});
  $("ttl").textContent=S.subject+" · "+S.stage;
  const all=allSt();$("sub").textContent=S.groups.length+" مجموعات، "+all.length+" طالب، "+S.price+" جنيه في الشهر";
  $("tabs").innerHTML=TABS.map(([k,l])=>'<button role="tab" data-t="'+k+'" aria-selected="'+(k==tab)+'">'+TICON[k]+'<span>'+l+'</span></button>').join("");
  $("btabs").innerHTML=BMAIN.map(k=>'<button role="tab" data-t="'+k+'" aria-selected="'+(k==tab)+'">'+TICON[k]+'<span>'+TL[k]+'</span></button>').join("")+'<button type="button" data-t="more" aria-expanded="'+moreOpen+'" aria-controls="sheet" aria-selected="'+BMORE.includes(tab)+'">'+IC_MORE+'<span>المزيد</span></button>';
  if(moreOpen)$("sheet").classList.remove("hide");else $("sheet").classList.add("hide");
  $("sheet").innerHTML=BMORE.map(k=>'<button role="tab" data-t="'+k+'" aria-selected="'+(k==tab)+'">'+TICON[k]+'<span>'+TL[k]+'</span></button>').join("");
  if(gi>=S.groups.length)gi=0;
  const v=$("view");
  const gsel=()=>'<label for="gs">المجموعة</label><select id="gs">'+S.groups.map((x,i)=>'<option value="'+i+'"'+(i==gi?' selected':'')+'>'+esc(gname(x))+'</option>').join("")+'</select>';
  if(!S.groups.length&&tab!="g"&&tab!="b"){v.innerHTML='<p>أضف مجموعة الأول من تبويب المجموعات.</p>';return}
  if(tab=="h"){
    const m=today().slice(0,7),rt=(ids)=>{let p=0,x=0;ids.forEach(id=>{const a=monthAtt(id,m);p+=a.p;x+=a.x});return p+x?Math.round(p/(p+x)*100)+"%":"—"};
    const col=all.filter(s=>paid(m,s.id)).length,sc=all.map(s=>monthExam(s.id,m)).filter(x=>x!=null),avg=sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length)+"%":"—";
    const late=all.filter(s=>overdue(s).length),risky=all.map(s=>({s,x:monthAtt(s.id,m).x})).filter(r=>r.x>=2).sort((a,b)=>b.x-a.x).slice(0,6);
    const st=(n,l)=>'<div class="stat"><strong>'+n+'</strong><span>'+l+'</span></div>';
    const dstr=new Date().toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    let h='<div class="hero"><h2>أهلًا بيك تاني</h2><p class="hd">'+dstr+' · نظرة سريعة على مجموعاتك ('+mname(m)+')</p><div class="stats">'+st(all.length,"طالب")+st(rt(all.map(s=>s.id)),"نسبة الحضور")+st(avg,"متوسط الدرجات")+st(totals(m).amount,"تحصيل بمبالغ مسجلة")+st((all.length-col)*S.price,"تقدير المطلوب بالسعر الحالي")+st(late.length,"متأخرين عن شهور")+'</div></div>';
    h+='<div class="qgrid">'+[["a","qa-b","تسجيل الحضور","حاضر وغايب النهارده"],["g","qa-g","المجموعات والطلاب","إضافة وتعديل"],["p","qa-o","المصاريف","تأكيد التحصيل"],["e","qa-p","امتحان جديد","سجّل الدرجات"]].map(q=>'<button type="button" class="qa '+q[1]+'" data-t="'+q[0]+'">'+TICON[q[0]]+'<b>'+q[2]+'</b><span>'+q[3]+'</span></button>').join("")+'</div>';
    const ms6=months6(),rate=mm=>{let p=0,x=0;all.forEach(s=>{const a=monthAtt(s.id,mm);p+=a.p;x+=a.x});return p+x?Math.round(p/(p+x)*100):null};
    h+='<div class="card"><h2>نسبة الحضور آخر 6 شهور</h2>'+bars(ms6.map(rate),ms6.map(sm),"%")+'</div><div class="card"><h2>الدخل آخر 6 شهور (جنيه)</h2>'+bars(ms6.map(mm=>totals(mm).amount),ms6.map(sm))+'<p>الرسم للمبالغ المسجلة فقط. الدفعات القديمة بلا مبلغ لا تدخل فيه.</p>'+'</div>';
    h+='<div class="card"><h2>المجموعات</h2>'+S.groups.map(g=>'<div class="stu"><b>'+esc(gname(g))+'</b><span>'+g.students.length+' طالب · حضور '+rt(g.students.map(s=>s.id))+' · دفع '+g.students.filter(s=>paid(m,s.id)).length+'/'+g.students.length+'</span></div>').join("")+'</div>';
    h+='<div class="card"><h2>محتاجين متابعة</h2>'+(risky.length||late.length?risky.map(r=>'<div class="stu"><span>'+esc(r.s.name)+' <span class="tag bad">غاب '+r.x+' مرة الشهر ده</span></span>'+A(r.s.phone,"السلام عليكم، لاحظنا غياب "+r.s.name+" "+r.x+" مرات هذا الشهر. نتمنى يكون بخير.","ابعت")+'</div>').join("")+late.map(s=>'<div class="stu"><span>'+esc(s.name)+' <span class="tag warn">متأخر '+overdue(s).length+' شهر</span></span>'+A(s.phone,"السلام عليكم، تذكير لطيف بمصاريف "+S.subject+" المتأخرة الخاصة بـ"+s.name+". شكرًا لحضرتك.","تذكير")+'</div>').join(""):'<p>مفيش حد محتاج متابعة دلوقتي.</p>')+'</div>';
    v.innerHTML=h;
  }else if(tab=="g"){
    const m=today().slice(0,7),col=all.filter(s=>paid(m,s.id)).length;
    let h='<div class="stats"><div class="stat"><strong>'+all.length+'</strong><span>طالب</span></div><div class="stat"><strong>'+col+'</strong><span>دفعوا الشهر ده</span></div><div class="stat"><strong>'+(all.length-col)*S.price+'</strong><span>جنيه متبقي</span></div></div>';
    h+=S.groups.map((g,i)=>'<div class="card"><div class="row" style="justify-content:space-between"><h2>'+esc(gname(g))+'</h2><button class="ghost sm fx" data-a="dg" data-i="'+i+'">حذف المجموعة</button></div>'+
      g.students.map((s,j)=>'<div class="stu"><span>'+esc(s.name)+' <span style="color:var(--mute);font-size:13px">'+esc(s.phone)+'</span></span><div class="btns">'+(g.notify?A(s.phone,"السلام عليكم، تم تغيير ميعاد "+S.subject+" لـ"+gname(g)+". برجاء التنبيه.","أبلغ"):"")+'<button class="ghost sm" data-a="ds" data-i="'+i+'" data-j="'+j+'">حذف</button></div></div>').join("")+
      (g.notify?'<button class="ghost sm" data-a="nd" data-i="'+i+'">تم إبلاغ الكل</button>':'')+
      '<label for="ns'+i+'">أضف طلاب (اسم، رقم ولي الأمر، كل طالب في سطر)</label><textarea id="ns'+i+'" placeholder="أحمد، 01012345678"></textarea><button class="sm" data-a="as" data-i="'+i+'" style="margin-top:6px">أضف</button>'+
      '<div style="margin-top:10px"><b>الأيام والميعاد</b>'+dayChips("r"+i,g.days)+'<div class="row" style="margin-top:6px"><div>من<input id="rt'+i+'" type="time" value="'+g.t+'"></div><div>إلى<input id="re'+i+'" type="time" value="'+(g.e||"")+'"></div><button class="ghost sm fx" data-a="rs" data-i="'+i+'">غيّر الميعاد</button></div></div></div>').join("");
    h+='<div class="card"><h2>مجموعة جديدة</h2><b>اختار الأيام</b>'+dayChips("n",[])+'<div class="row" style="margin-top:6px"><input id="nt" type="time" value="17:00" aria-label="من"><input id="ne" type="time" value="19:00" aria-label="إلى"><button class="fx" data-a="ag">أضف</button></div></div>';
    v.innerHTML=h;
  }else if(tab=="s"){
    const student=sid&&findSt(sid),f=student?{...student,g:S.groups.find(group=>group.students.includes(student))}:null;
    if(!f){v.innerHTML=all.length?S.groups.map(g=>'<div class="card"><h2>'+esc(gname(g))+'</h2>'+g.students.map(s=>'<div class="stu"><span>'+esc(s.name)+(s.lvl?' <span class="tag '+(s.lvl=="محتاج دعم"?'bad':'ok')+'">'+s.lvl+'</span>':'')+(s.ct?' <span class="tag warn">'+s.ct+'</span>':'')+'</span><button class="sm ghost" data-a="os" data-id="'+s.id+'">الملف</button></div>').join("")+'</div>').join(""):'<p>أضف طلاب الأول من تبويب المجموعات.</p>'}
    else{const ms=months6(),att=ms.map(mm=>monthAtt(f.id,mm)),ex=S.exams.filter(e=>e.gid==f.g.id&&e.scores[f.id]!=null&&e.scores[f.id]!=="").slice(-6);
      const sl=(fl,l,o)=>'<label>'+l+'<select data-f="'+fl+'" data-sid="'+f.id+'"><option value="">—</option>'+o.map(x=>'<option'+(f[fl]==x?' selected':'')+'>'+x+'</option>').join("")+'</select></label>';
      const ta=(fl,l)=>'<label>'+l+'<textarea data-f="'+fl+'" data-sid="'+f.id+'">'+esc(f[fl]||"")+'</textarea></label>';
      v.innerHTML='<button class="ghost sm" data-a="cs">رجوع لكل الطلاب</button><div class="card" style="margin-top:10px"><h2>'+esc(f.name)+'</h2><p>'+esc(gname(f.g))+' · '+esc(f.phone)+'</p>'+sl("lvl","المستوى",["ممتاز","جيد","محتاج دعم"])+sl("ct","أفضل وقت للتواصل مع ولي الأمر",["صباحًا","مساءً","أي وقت"])+sl("style","أسلوب التعلم المفضل",["شرح","تمارين","ملخصات","مراجعة شفوية"])+ta("strg","نقاط القوة")+ta("weak","نقاط تحتاج تحسين")+ta("note","ملاحظات")+'</div><div class="card"><h2>الحضور (حصص في الشهر)</h2>'+bars(att.map(a=>a.p),ms.map(sm))+'</div><div class="card"><h2>درجات آخر امتحانات</h2>'+(ex.length?bars(ex.map(e=>Math.round(e.scores[f.id]/e.max*100)),ex.map(e=>e.title.slice(0,7)),"%"):'<p>مفيش درجات لسه.</p>')+'</div><div class="card"><h2>المصاريف</h2><div class="btns">'+ms.map(mm=>'<span class="tag '+(paid(mm,f.id)?'ok':'warn')+'">'+sm(mm)+(paid(mm,f.id)?' دفع':' لسه')+'</span>').join("")+'</div></div>'}
  }else if(tab=="a"){
    const g=S.groups[gi],k=adate+"|"+g.id,rec=S.att[k]||{};
    v.innerHTML=gsel()+'<label for="ad">التاريخ</label><input id="ad" type="date" value="'+adate+'"><div class="card" style="margin-top:12px">'+(g.students.length?g.students.map((s,j)=>{const r=rec[s.id],mm=monthAtt(s.id,adate.slice(0,7));return'<div class="stu"><span>'+esc(s.name)+' <span class="tag '+(mm.x>2?'bad':'ok')+'">غاب '+mm.x+' في الشهر</span></span><div class="btns">'+(r===false?A(s.phone,"السلام عليكم، "+s.name+" غاب عن حصة "+S.subject+" ("+adate+"). نتمنى يكون بخير.","ابعت لولي الأمر"):"")+'<button class="sm'+(r===true?'':' ghost')+'" data-a="p" data-j="'+j+'">حاضر</button><button class="sm'+(r===false?'':' ghost')+'" data-a="x" data-j="'+j+'">غايب</button></div></div>'}).join(""):'<p>مفيش طلاب في المجموعة دي لسه.</p>')+'</div>';
  }else if(tab=="p"){
    const exp=all.filter(s=>!paid(pmonth,s.id)).length*S.price,col=totals(pmonth).amount;
    let h='<label for="pm">الشهر</label><input id="pm" type="month" value="'+pmonth+'"><div class="stats" style="margin-top:12px"><div class="stat"><strong>'+income(pmonth)+'</strong><span>تفصيل التحصيل</span></div><div class="stat"><strong>'+col+'</strong><span>اتحصّل</span></div><div class="stat"><strong>'+exp+'</strong><span>تقدير غير المدفوع</span></div></div>';
    h+=S.groups.map(g=>'<div class="card"><h2>'+esc(gname(g))+'</h2>'+g.students.map(s=>{const o=overdue(s),pd=paid(pmonth,s.id);return'<div class="stu"><span>'+esc(s.name)+' <span class="tag '+(pd?'ok':'warn')+'">'+(pd?'دفع':'لسه')+'</span>'+(o.length?' <span class="tag bad">متأخر '+o.length+' شهر</span>':'')+'</span><div class="btns">'+(pd?'':A(s.phone,"السلام عليكم، تذكير لطيف بمصاريف "+S.subject+" لشهر "+mname(pmonth)+" الخاصة بـ"+s.name+" ("+S.price+" جنيه). شكرًا لحضرتك.","تذكير"))+'<button class="sm ghost" data-a="pay" data-id="'+s.id+'">'+(pd?'إلغاء':'تم الدفع')+'</button></div></div>'}).join("")+'</div>').join("");
    v.innerHTML=h;
  }else if(tab=="e"){
    let h='<div class="card"><h2>امتحان جديد</h2>'+gsel()+'<div class="row"><div><label for="et">الاسم</label><input id="et" placeholder="امتحان الباب الأول"></div><div><label for="em">من كام</label><input id="em" type="number" value="20"></div></div><button class="sm" data-a="ae" style="margin-top:8px">أضف الامتحان</button></div>';
    h+=S.exams.slice().reverse().map(e=>{const g=S.groups.find(x=>x.id==e.gid);if(!g)return"";return'<div class="card"><div class="row" style="justify-content:space-between"><h2>'+esc(e.title)+' <span style="color:var(--mute);font-size:13px">'+esc(gname(g))+" · "+e.date+'</span></h2><button class="ghost sm fx" data-a="de" data-id="'+e.id+'">حذف</button></div>'+g.students.map(s=>{const sc=e.scores[s.id];return'<div class="stu"><span>'+esc(s.name)+'</span><div class="btns"><input class="sc" type="number" min="0" max="'+e.max+'" data-e="'+e.id+'" data-s="'+s.id+'" value="'+(sc==null?"":sc)+'" aria-label="درجة '+esc(s.name)+'"> / '+e.max+(sc!=null&&sc!==""?A(s.phone,"السلام عليكم، درجة "+s.name+" في "+e.title+": "+sc+" من "+e.max+".","ابعت"):"")+'</div></div>'}).join("")+'</div>'}).join("");
    v.innerHTML=h;
  }else if(tab=="b"){
    v.innerHTML='<div class="card"><h2>النسخ الاحتياطي</h2><p>نزّل نسخة JSON من كل بياناتك في أي وقت. النسخة تحتوي بيانات طلابك، احفظها في مكان خاص وآمن.</p><button type="button" data-a="bk">تنزيل نسخة احتياطية</button></div>'
      +'<div class="card"><h2>استعادة نسخة</h2><label for="restorePick">استعادة نسخة JSON (بحد أقصى 5 ميجابايت)</label><input id="restorePick" class="srfile" type="file" accept="application/json,.json"><div class="btns"><button type="button" id="restoreBtn">اختيار ملف النسخة</button><span id="restoreName" class="fname" aria-live="polite"></span></div><small>الاستعادة بتنزّل نسخة من بياناتك الحالية الأول، وبعدين بتستبدلها بعد الحفظ.</small></div>'
      +'<div class="card"><h2>مزامنة الحفظ</h2><p>حالة الحفظ بتظهر دايمًا في شريط الحالة أعلى الصفحة.</p><div class="btns"><button type="button" class="ghost sm" data-a="retry">حاول الحفظ</button><button type="button" class="ghost sm" data-a="reload">إعادة تحميل البيانات</button></div></div>';
  }else{
    const ms=months6();
    let h='<div class="card"><h2>الدخل آخر 6 شهور</h2>'+ms.map(m=>{const c=income(m);return'<div class="stu"><span>'+mname(m)+'</span><b>'+c+'</b></div>'}).join("")+'</div>';
    const tp=all.map(s=>({s,e:monthExam(s.id,rmonth)})).filter(r=>r.e!=null).sort((a,b)=>b.e-a.e).slice(0,5);
    h+='<div class="card"><h2>الأوائل في '+mname(rmonth)+'</h2>'+(tp.length?tp.map(r=>'<div class="stu"><span>'+esc(r.s.name)+'</span><b>'+r.e+'%</b></div>').join(""):'<p>مفيش درجات الشهر ده.</p>')+'</div>';
    h+='<label for="rm">تقرير شهر</label><input id="rm" type="month" value="'+rmonth+'" style="margin-bottom:12px">';
    h+=S.groups.map(g=>'<div class="card"><h2>'+esc(gname(g))+'</h2>'+g.students.map(s=>{const a=monthAtt(s.id,rmonth),ex=monthExam(s.id,rmonth),pd=paid(rmonth,s.id);
      const msg="السلام عليكم، تقرير "+s.name+" لشهر "+mname(rmonth)+" في "+S.subject+":\nالحضور: "+a.p+" حصة، الغياب: "+a.x+"\nالدرجات: "+(ex==null?"لا يوجد امتحان":ex+"%")+"\nالمصاريف: "+(pd?"مدفوعة":"لم تُدفع بعد")+"\nشكرًا لحضرتك.";
      return'<div class="stu"><span>'+esc(s.name)+' <span class="tag ok">حضر '+a.p+'</span> <span class="tag '+(a.x?'bad':'ok')+'">غاب '+a.x+'</span>'+(ex==null?'':' <span class="tag warn">'+ex+'%</span>')+'</span>'+A(s.phone,msg,"ابعت التقرير")+'</div>'}).join("")+'</div>').join("");
    v.innerHTML=h;
  }
  const q=(id,fn)=>{const e=$(id);if(e)e.onchange=fn};
  q("gs",e=>{gi=+e.target.value;render()});q("ad",e=>{adate=e.target.value||today();render()});
  q("pm",e=>{pmonth=e.target.value||pmonth;render()});q("rm",e=>{rmonth=e.target.value||rmonth;render()});
  const rb=$("restoreBtn");if(rb)rb.onclick=()=>{const i=$("restorePick");if(i)i.click()};
}
$("tabs").onclick=e=>{const b=e.target.closest("button[data-t]");if(b){tab=b.dataset.t;render()}};
$("btabs").onclick=e=>{const b=e.target.closest("button[data-t]");if(!b)return;if(b.dataset.t=="more"){moreOpen=!moreOpen;render();return}moreOpen=false;tab=b.dataset.t;render()};
$("sheet").onclick=e=>{const b=e.target.closest("button[data-t]");if(!b)return;moreOpen=false;tab=b.dataset.t;render()};
$("view").onchange=e=>{const t=e.target;if(t.id==="restorePick"){restoreFile(t);return}if(t.dataset&&(t.dataset.f||t.dataset.e)&&!active()){flash();render();return}if(t.dataset&&t.dataset.f){const s=findSt(t.dataset.sid);if(s){s[t.dataset.f]=t.value;persist()}return}if(t.dataset&&t.dataset.e){const ex=S.exams.find(x=>x.id==t.dataset.e);ex.scores[t.dataset.s]=C.clampScore(t.value,ex.max);persist();render()}};
$("view").onclick=async e=>{
  const tb=e.target.closest("button[data-t]");if(tb){tab=tb.dataset.t;render();return}
  const b=e.target.closest("button[data-a]");if(!b)return;
  if(!active()&&!["os","cs","bk","retry","reload"].includes(b.dataset.a)){flash();return}
  const a=b.dataset.a,i=+b.dataset.i,j=+b.dataset.j,m=today().slice(0,7);
  if(a==="os"||a==="cs"){sid=a==="os"?b.dataset.id:null;render();return}
  if(a=="dg"){confirm("حذف المجموعة وطلابها من القوائم؟ نزّل نسخة احتياطية قبل الحذف. سيظل سجل التحصيل الجديد محفوظًا.")&&S.groups.splice(i,1)}
  else if(a=="ds"){confirm("حذف الطالب من القوائم؟ نزّل نسخة احتياطية قبل الحذف. سيظل سجل التحصيل الجديد محفوظًا.")&&S.groups[i].students.splice(j,1)}
  else if(a=="as"){S.groups[i].students.push(...$("ns"+i).value.split("\n").map(l=>l.split(/[,،]/).map(x=>x.trim())).filter(r=>r[0]).map(r=>({id:rid(),name:r[0],phone:r[1]||"",since:m})))}
  else if(a=="rs"){const g=S.groups[i],ds=getDays("r"+i);if(!ds.length)return;g.days=ds;g.t=$("rt"+i).value||g.t;g.e=$("re"+i).value||"";g.notify=g.students.length>0}
  else if(a=="nd"){S.groups[i].notify=false}
  else if(a=="ag"){const ds=getDays("n");if(!ds.length)return;S.groups.push({id:rid(),days:ds,t:$("nt").value||"17:00",e:$("ne").value||"",notify:false,students:[]})}
  else if(a=="p"||a=="x"){const g=S.groups[gi],k=adate+"|"+g.id;S.att[k]=S.att[k]||{};const id=g.students[j].id,v=a=="p";S.att[k][id]=S.att[k][id]===v?null:v}
  else if(a=="pay"){const student=findSt(b.dataset.id);if(!confirm(paid(pmonth,student.id)?"تأكيد إلغاء الدفعة؟ سيتم تسجيل عكس للمبلغ المعروف.":"تأكيد تحصيل "+S.price+" جنيه من "+student.name+" لشهر "+mname(pmonth)+"؟"))return;C.togglePayment(S,pmonth,student.id,rid())}
  else if(a=="ae"){const t=$("et").value.trim();if(!t)return;S.exams.push({id:rid(),gid:S.groups[gi].id,title:t,date:today(),max:Math.max(1,num($("em").value)||20),scores:{}})}
  else if(a=="de"){confirm("حذف الامتحان ودرجاته؟")&&(S.exams=S.exams.filter(x=>x.id!=b.dataset.id))}
  else if(a=="bk"){downloadBackup();return}
  else if(a=="retry"){save2();return}
  else if(a=="reload"){if(dirty&&!confirm("يوجد تعديل غير محفوظ. نزّل نسخة احتياطية أولًا. هل تريد تجاهله وتحميل النسخة المحفوظة؟"))return;clearTimeout(pt);if(saving){status("انتظر اكتمال محاولة الحفظ أولًا.");return}load();return}
  persist();render();
};
sb.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"&&uid){uid=null;clearTimeout(pt);$("app").classList.add("hide");$("wiz").classList.add("hide");$("auth").classList.remove("hide");status("انتهت جلسة الدخول. نزّل أي تغييرات غير محفوظة قبل إعادة الدخول.")}});
init();
