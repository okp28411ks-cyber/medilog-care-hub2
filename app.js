/* =========================================================
   MediLog Care - app.js
   Supabase JS v2 / GitHub + Vercel + Supabase
   ========================================================= */
const SUPABASE_URL = "https://ufmcloqjcolpvzhnobgg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const state = {
  user: null, profile: null, page: "dashboard",
  medications: [], health: [], logs: [], alarms: [], appointments: [],
  visits: [], encounters: [], friends: [], requests: [], notifications: [], shared: [],
  editingId: null
};

const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const today = () => new Date().toISOString().slice(0,10);
const nowISO = () => new Date().toISOString();
const fmtDate = v => v ? new Date(v).toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"}) : "—";
const fmtDateTime = v => v ? new Date(v).toLocaleString("ja-JP",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const val = id => $(id)?.value?.trim() || null;

function toast(message, type="success"){
  const el=document.createElement("div"); el.className=`toast ${type}`; el.textContent=message;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(()=>el.remove(),3200);
}
function showError(e){ console.error(e); toast(e?.message || "エラーが発生しました。","error"); }
function setFormMessage(t="", ok=false){ $("auth-message").textContent=t; $("auth-message").style.color=ok?"var(--green)":"var(--red)"; }

async function db(table, action="select", payload=null, opts={}){
  let q = sb.from(table);
  if(action==="select"){
    q=q.select(opts.select || "*");
    if(opts.eq) Object.entries(opts.eq).forEach(([k,v])=>q=q.eq(k,v));
    if(opts.neq) Object.entries(opts.neq).forEach(([k,v])=>q=q.neq(k,v));
    if(opts.ilike) Object.entries(opts.ilike).forEach(([k,v])=>q=q.ilike(k,v));
    if(opts.order) q=q.order(opts.order.col,{ascending:opts.order.asc!==false});
    if(opts.limit) q=q.limit(opts.limit);
    const {data,error}=await q; if(error) throw error; return data||[];
  }
  if(action==="insert"){const {data,error}=await q.insert(payload).select();if(error)throw error;return data||[];}
  if(action==="update"){const {data,error}=await q.update(payload).match(opts.eq).select();if(error)throw error;return data||[];}
  if(action==="delete"){const {error}=await q.delete().match(opts.eq);if(error)throw error;return [];}
}
async function rpc(name,args={}){const {data,error}=await sb.rpc(name,args);if(error)throw error;return data;}

async function init(){
  bindStaticEvents();
  sb.auth.onAuthStateChange(async (_event, session)=>{
    if(session?.user){ state.user=session.user; await loadApp(); }
    else { state.user=null; showAuth(); }
  });
  const {data:{session}}=await sb.auth.getSession();
  if(session?.user){state.user=session.user;await loadApp();} else showAuth();
}
function showAuth(){$("auth-screen").classList.remove("hidden");$("app-screen").classList.add("hidden")}
async function loadApp(){
  $("auth-screen").classList.add("hidden");$("app-screen").classList.remove("hidden");
  try{
    await loadProfile();
    await Promise.all([loadMedications(),loadHealth(),loadLogs(),loadAlarms(),loadAppointments(),loadVisits(),loadEncounters(),loadFriends(),loadRequests(),loadNotifications(),loadShared()]);
    renderAll();
    startLocalReminderLoop();
  }catch(e){showError(e)}
}
async function loadProfile(){
  const rows=await db("profiles","select",null,{eq:{id:state.user.id},limit:1});
  state.profile=rows[0]||null;
  if(!state.profile){
    const username=(state.user.user_metadata?.username || state.user.email?.split("@")[0] || "User").slice(0,40);
    const rows2=await db("profiles","insert",{id:state.user.id,username});
    state.profile=rows2[0];
  }
  $("top-username").textContent=state.profile.username;
  $("welcome-name").textContent=state.profile.username;
  $("avatar").textContent=(state.profile.username||"U").charAt(0).toUpperCase();
  $("profile-email").value=state.user.email||"";
  $("profile-username").value=state.profile.username||"";
  $("gender").value=state.profile.gender||"";
  $("age").value=state.profile.age??"";
  $("height").value=state.profile.height??"";
  $("weight").value=state.profile.weight??"";
  $("allergies").value=state.profile.allergies||"";
  $("conditions").value=state.profile.conditions||"";
}
async function loadMedications(){state.medications=await db("medications","select",null,{eq:{user_id:state.user.id},order:{col:"created_at",asc:false}})}
async function loadHealth(){state.health=await db("health_records","select",null,{eq:{user_id:state.user.id},order:{col:"record_date",asc:false},limit:90})}
async function loadLogs(){state.logs=await db("medication_logs","select",null,{eq:{user_id:state.user.id},order:{col:"taken_at",asc:false},limit:1000})}
async function loadAlarms(){state.alarms=await db("medication_alarms","select",null,{eq:{user_id:state.user.id},order:{col:"time",asc:true}})}
async function loadAppointments(){state.appointments=await db("appointments","select",null,{eq:{user_id:state.user.id},order:{col:"scheduled_at",asc:true}})}
async function loadVisits(){state.visits=await db("medical_visits","select",null,{eq:{user_id:state.user.id},order:{col:"visit_date",asc:false}})}
async function loadEncounters(){state.encounters=await db("medical_encounters","select",null,{eq:{user_id:state.user.id},order:{col:"encounter_date",asc:false}})}
async function loadFriends(){state.friends=await rpc("get_my_friends")}
async function loadRequests(){state.requests=await rpc("get_my_friend_requests")}
async function loadNotifications(){state.notifications=await db("notifications","select",null,{eq:{user_id:state.user.id},order:{col:"created_at",asc:false},limit:100})}
async function loadShared(){state.shared=await db("shared_medications","select",null,{eq:{recipient_id:state.user.id},order:{col:"created_at",asc:false}})}

function bindStaticEvents(){
  document.querySelectorAll("[data-auth-tab]").forEach(b=>b.onclick=()=>switchAuth(b.dataset.authTab));
  $("login-form").onsubmit=login;
  $("signup-form").onsubmit=signup;
  $("logout-btn").onclick=async()=>{await sb.auth.signOut();toast("ログアウトしました。")};
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>go(b.dataset.page));
  document.querySelectorAll("[data-page-jump]").forEach(b=>b.onclick=()=>go(b.dataset.pageJump));
  $("mobile-menu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
  $("health-form").onsubmit=saveHealth;
  $("health-today-btn").onclick=()=>loadHealthForDate(today());
  $("basic-info-form").onsubmit=saveBasicInfo;
  $("medical-profile-form").onsubmit=saveMedicalProfile;
  $("visit-form").onsubmit=saveVisit;
  $("profile-form").onsubmit=saveProfile;
  $("add-medication-btn").onclick=()=>openMedicationModal();
  $("add-med-log-btn").onclick=()=>openLogModal();
  $("add-alarm-btn").onclick=()=>openAlarmModal();
  $("add-appointment-btn").onclick=()=>openAppointmentModal();
  $("add-encounter-btn").onclick=()=>openEncounterModal();
  $("med-search").oninput=renderMedications;
  $("med-filter").onchange=renderMedications;
  $("med-log-range").onchange=renderLogs;
  $("stats-range").onchange=renderStatistics;
  $("friend-search-btn").onclick=searchFriends;
  $("mark-all-read").onclick=markAllRead;
  $("request-notification").onclick=requestBrowserNotification;
  $("modal-close").onclick=closeModal;
  document.querySelector(".modal-backdrop").onclick=closeModal;
}

function switchAuth(which){
  document.querySelectorAll(".auth-tabs .tab").forEach(x=>x.classList.toggle("active",x.dataset.authTab===which));
  $("login-form").classList.toggle("hidden",which!=="login");$("signup-form").classList.toggle("hidden",which!=="signup");setFormMessage("");
}
async function login(e){
  e.preventDefault();setFormMessage("ログイン中…");
  try{const {error}=await sb.auth.signInWithPassword({email:val("login-email"),password:val("login-password")});if(error)throw error;setFormMessage("ログインしました。",true)}
  catch(e){setFormMessage(e.message)}
}
async function signup(e){
  e.preventDefault();setFormMessage("アカウント作成中…");
  if(val("signup-password")!==val("signup-password2"))return setFormMessage("パスワードが一致しません。");
  try{
    const email=val("signup-email"), username=val("signup-username"), password=val("signup-password");
    const existing=await db("profiles","select",null,{ilike:{username:username},limit:1});
    if(existing.length)return setFormMessage("そのユーザー名はすでに使用されています。");
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{username}}});
    if(error)throw error;
    if(data.session){state.user=data.user;await loadApp();}else setFormMessage("登録しました。メール確認が必要な設定の場合は、確認メールを開いてからログインしてください。",true);
  }catch(e){setFormMessage(e.message)}
}

function go(page){
  state.page=page;
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active-page",p.id===`page-${page}`));
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const names={dashboard:"ダッシュボード",health:"体調管理",records:"自身記録",medications:"おくすり在庫","medication-log":"服薬記録",alarms:"服薬アラーム",appointments:"通院予定",statistics:"統計",friends:"フレンド",notifications:"通知",profile:"プロフィール"};
  $("page-title").textContent=names[page]||page;$("page-kicker").textContent="MediLog Care";
  document.querySelector(".sidebar").classList.remove("open");
  if(page==="statistics")renderStatistics();if(page==="notifications")renderNotifications();
}

function renderAll(){renderDashboard();renderHealthHistory();renderVisits();renderEncounters();renderMedications();renderLogs();renderAlarms();renderAppointments();renderStatistics();renderFriends();renderRequests();renderNotifications();renderShared();$("today-label").textContent=new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric",weekday:"long"});loadHealthForDate(today())}
function renderDashboard(){
  const h=state.health.find(x=>x.record_date===today());$("dash-health-status").textContent=h?"記録済み":"未記録";
  const dayStart=new Date();dayStart.setHours(0,0,0,0);$("dash-med-count").textContent=state.logs.filter(x=>new Date(x.taken_at)>=dayStart).length+"回";
  $("dash-alarm-count").textContent=state.alarms.filter(x=>x.enabled!==false).length+"件";
  const low=state.medications.filter(m=>Number(m.stock||0)<=5);$("dash-low-stock").textContent=low.length+"件";
  $("bp-morning").textContent=h?.morning_systolic?`${h.morning_systolic}/${h.morning_diastolic}`:"—";$("bp-noon").textContent=h?.noon_systolic?`${h.noon_systolic}/${h.noon_diastolic}`:"—";$("bp-night").textContent=h?.night_systolic?`${h.night_systolic}/${h.night_diastolic}`:"—";
  const ap=state.appointments.find(x=>new Date(x.scheduled_at)>=new Date());$("next-appointment").innerHTML=ap?`<strong>${esc(fmtDateTime(ap.scheduled_at))}</strong><div class="muted">${esc(ap.hospital_name||"")} ${esc(ap.department||"")}</div><div class="muted">${esc(ap.note||"")}</div>`:`<span>次回の通院予定はありません</span>`;
  $("recent-med-logs").innerHTML=state.logs.slice(0,5).map(logItem).join("")||'<div class="empty">服薬記録はありません</div>';
  $("low-stock-list").innerHTML=low.slice(0,5).map(m=>`<div class="list-item"><div class="main-info"><strong>${esc(m.name)}</strong><small>${esc(m.strength||"")} / ${esc(m.category||"")}</small></div><span class="stock low">残り ${m.stock??0}</span></div>`).join("")||'<div class="empty">在庫が少ないおくすりはありません</div>';
}
function logItem(l){return `<div class="list-item"><div class="main-info"><strong>${esc(l.medication_name||medName(l.medication_id))}</strong><small>${fmtDateTime(l.taken_at)} ・ ${esc(l.timing||"")}</small></div><span>${esc(l.dose||"")}</span></div>`}
function medName(id){return state.medications.find(m=>m.id===id)?.name||"不明なおくすり"}

async function loadHealthForDate(date){
  const h=state.health.find(x=>x.record_date===date);
  $("health-id").value=h?.id||"";
  ["bp-morning-sys","bp-morning-dia","bp-morning-pulse","bp-noon-sys","bp-noon-dia","bp-noon-pulse","bp-night-sys","bp-night-dia","bp-night-pulse"].forEach((id,i)=>{
    const key=["morning_systolic","morning_diastolic","morning_pulse","noon_systolic","noon_diastolic","noon_pulse","night_systolic","night_diastolic","night_pulse"][i];$(id).value=h?.[key]??"";
  });
  $("wake-time").value=h?.wake_time||"";$("sleep-time").value=h?.sleep_time||"";$("diet").value=h?.diet||"";$("alcohol").value=h?.alcohol||"なし";$("smoking").value=h?.smoking||"なし";$("mood").value=h?.mood||"";$("daily-note").value=h?.daily_note||"";
}
async function saveHealth(e){
  e.preventDefault();try{
    const payload={user_id:state.user.id,record_date:today(),morning_systolic:num("bp-morning-sys"),morning_diastolic:num("bp-morning-dia"),morning_pulse:num("bp-morning-pulse"),noon_systolic:num("bp-noon-sys"),noon_diastolic:num("bp-noon-dia"),noon_pulse:num("bp-noon-pulse"),night_systolic:num("bp-night-sys"),night_diastolic:num("bp-night-dia"),night_pulse:num("bp-night-pulse"),wake_time:val("wake-time"),sleep_time:val("sleep-time"),diet:val("diet"),alcohol:val("alcohol"),smoking:val("smoking"),mood:val("mood"),daily_note:val("daily-note")};
    const existing=state.health.find(x=>x.record_date===today());if(existing)await db("health_records","update",payload,{eq:{id:existing.id}});else await db("health_records","insert",payload);
    await loadHealth();renderDashboard();renderHealthHistory();toast("今日の体調を保存しました。");
  }catch(e){showError(e)}
}
function num(id){const v=$(id).value;return v===""?null:Number(v)}
function renderHealthHistory(){$("health-history").innerHTML=`<table class="data-table"><thead><tr><th>日付</th><th>朝</th><th>昼</th><th>晩</th><th>こころ</th><th>食生活</th></tr></thead><tbody>${state.health.slice(0,30).map(h=>`<tr><td>${esc(h.record_date)}</td><td>${h.morning_systolic?`${h.morning_systolic}/${h.morning_diastolic}`:"—"}</td><td>${h.noon_systolic?`${h.noon_systolic}/${h.noon_diastolic}`:"—"}</td><td>${h.night_systolic?`${h.night_systolic}/${h.night_diastolic}`:"—"}</td><td>${esc(h.mood||"—")}</td><td>${esc(h.diet||"—")}</td></tr>`).join("")}</tbody></table>`}

async function saveBasicInfo(e){e.preventDefault();try{await db("profiles","update",{gender:val("gender"),age:num("age"),height:num("height"),weight:num("weight")},{eq:{id:state.user.id}});await loadProfile();toast("基本情報を保存しました。")}catch(e){showError(e)}}
async function saveMedicalProfile(e){e.preventDefault();try{await db("profiles","update",{allergies:val("allergies"),conditions:val("conditions")},{eq:{id:state.user.id}});await loadProfile();toast("医療情報を保存しました。")}catch(e){showError(e)}}
async function saveProfile(e){e.preventDefault();try{const username=val("profile-username");const other=await db("profiles","select",null,{ilike:{username},neq:{id:state.user.id},limit:1});if(other.length)throw new Error("そのユーザー名はすでに使用されています。");await db("profiles","update",{username},{eq:{id:state.user.id}});await loadProfile();toast("プロフィールを更新しました。")}catch(e){showError(e)}}
async function saveVisit(e){e.preventDefault();try{await db("medical_visits","insert",{user_id:state.user.id,visit_date:val("visit-date"),hospital_name:val("visit-hospital"),department:val("visit-department"),doctor:val("visit-doctor"),note:val("visit-note")});e.target.reset();await loadVisits();renderVisits();toast("通院履歴を追加しました。")}catch(e){showError(e)}}
function renderVisits(){$("visits-list").innerHTML=state.visits.map(v=>`<div class="list-item"><div class="main-info"><strong>${esc(v.hospital_name||"医療機関未入力")}</strong><small>${esc(v.visit_date)} ・ ${esc(v.department||"")} ・ ${esc(v.doctor||"")}</small><small>${esc(v.note||"")}</small></div><button class="btn small secondary" onclick="deleteVisit('${v.id}')">削除</button></div>`).join("")||'<div class="empty">通院履歴はありません。</div>'}
window.deleteVisit=async id=>{if(!confirm("削除しますか？"))return;try{await db("medical_visits","delete",null,{eq:{id}});await loadVisits();renderVisits();toast("削除しました。")}catch(e){showError(e)}}
function renderEncounters(){$("encounters-list").innerHTML=state.encounters.map(v=>`<div class="list-item"><div class="main-info"><strong>${esc(v.title||"受診記録")}</strong><small>${esc(v.encounter_date)} ・ ${esc(v.hospital_name||"")} ・ ${esc(v.department||"")}</small><small>${esc(v.note||"")}</small></div><button class="btn small secondary" onclick="deleteEncounter('${v.id}')">削除</button></div>`).join("")||'<div class="empty">受診記録はありません。</div>'}
window.deleteEncounter=async id=>{if(!confirm("削除しますか？"))return;try{await db("medical_encounters","delete",null,{eq:{id}});await loadEncounters();renderEncounters();toast("削除しました。")}catch(e){showError(e)}}

function openModal(html){$("modal-content").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");state.editingId=null}
function openMedicationModal(id=null){
  const m=id?state.medications.find(x=>x.id===id):null;state.editingId=id;
  openModal(`<h3>${m?"おくすりを編集":"おくすりを追加"}</h3><form id="med-modal-form" class="modal-form">
  <div class="grid2"><label>おくすりの名前*<input id="m-name" required value="${esc(m?.name||"")}"></label><label>含有量（mg）<input id="m-strength" value="${esc(m?.strength||"")}"></label></div>
  <div class="grid2"><label>製薬会社<input id="m-company" value="${esc(m?.manufacturer||"")}"></label><label>薬種類<input id="m-type" placeholder="睡眠導入薬・解熱鎮痛剤など" value="${esc(m?.medication_type||"")}"></label></div>
  <div class="grid2"><label>分類<select id="m-category"><option>処方</option><option>市販</option><option>個人輸入</option><option>その他</option></select></label><label>在庫数<input id="m-stock" type="number" min="0" value="${m?.stock??0}"></label></div>
  <div class="grid2"><label>医療機関名（処方のみ）<input id="m-hospital" value="${esc(m?.hospital_name||"")}"></label><label>診療科（処方のみ）<input id="m-dept" value="${esc(m?.department||"")}"></label></div>
  <div class="grid2"><label>処方医（処方のみ）<input id="m-doctor" value="${esc(m?.doctor||"")}"></label><label>使用期限<input id="m-expiry" type="date" value="${esc(m?.expiry_date||"")}"></label></div>
  <div class="grid2"><label>調剤日<input id="m-dispensed" type="date" value="${esc(m?.dispensed_date||"")}"></label><label>1回の服用量<input id="m-dose" value="${esc(m?.dose||"")}" placeholder="1"></label></div>
  <div class="grid2"><label>1日の服用回数<input id="m-frequency" value="${esc(m?.frequency||"")}" placeholder="3"></label><label>単位<input id="m-unit" value="${esc(m?.unit||"錠")}" placeholder="錠"></label></div>
  <div class="grid2"><label>服用状況<select id="m-status"><option>服用中</option><option>休止中</option><option>中止済み</option></select></label><label>服用タイミング<input id="m-timing" placeholder="朝・昼・夕・寝る前" value="${esc(m?.timing||"")}"></label></div>
  <div class="grid2"><label>購入先・処方薬局名<input id="m-pharmacy" value="${esc(m?.pharmacy||"")}"></label><label>写真<input id="m-photo" type="file" accept="image/*"></label></div>
  <label>写真URL（カメラロールの代わりにURLでも可）<input id="m-photo-url" type="url" value="${esc(m?.photo_url||"")}"></label>
  <label>メモ<textarea id="m-note" rows="3">${esc(m?.note||"")}</textarea></label><div class="file-note">写真ファイルはSupabase Storageの「medication-photos」バケットへ保存します。URLを入力した場合はそのURLを使用します。</div>
  <div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">キャンセル</button><button class="btn primary">保存する</button></div></form>`);
  $("m-category").value=m?.category||"処方";$("m-status").value=m?.status||"服用中";$("med-modal-form").onsubmit=saveMedication;
}
async function saveMedication(e){
  e.preventDefault();try{
    let photo=val("m-photo-url");const file=$("m-photo").files[0];
    if(file){const path=`${state.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;const {error}=await sb.storage.from("medication-photos").upload(path,file,{upsert:false});if(error)throw error;const {data}=sb.storage.from("medication-photos").getPublicUrl(path);photo=data.publicUrl}
    const payload={user_id:state.user.id,name:val("m-name"),strength:val("m-strength"),manufacturer:val("m-company"),medication_type:val("m-type"),category:val("m-category"),stock:num("m-stock")||0,hospital_name:val("m-hospital"),department:val("m-dept"),doctor:val("m-doctor"),expiry_date:val("m-expiry"),dispensed_date:val("m-dispensed"),dose:val("m-dose"),frequency:val("m-frequency"),unit:val("m-unit"),status:val("m-status"),timing:val("m-timing"),pharmacy:val("m-pharmacy"),photo_url:photo,note:val("m-note")};
    if(state.editingId)await db("medications","update",payload,{eq:{id:state.editingId}});else await db("medications","insert",payload);
    closeModal();await loadMedications();renderMedications();renderDashboard();renderStatistics();toast("おくすりを保存しました。")
  }catch(e){showError(e)}
}
function renderMedications(){
  const q=($("med-search").value||"").toLowerCase(),cat=$("med-filter").value;
  const arr=state.medications.filter(m=>(!q||[m.name,m.manufacturer,m.medication_type].join(" ").toLowerCase().includes(q))&&(!cat||m.category===cat));
  $("medications-grid").innerHTML=arr.map(m=>`<article class="med-card"><div class="med-top"><img class="med-photo" src="${esc(m.photo_url||"")}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="med-photo" style="display:${m.photo_url?"none":"grid"}">＋</div><div><h3>${esc(m.name)}</h3><div class="med-meta">${esc(m.strength||"")} ${esc(m.unit||"")} ・ ${esc(m.manufacturer||"")}</div></div></div><div class="med-tags"><span class="tag">${esc(m.category)}</span><span class="tag">${esc(m.medication_type||"種類未設定")}</span><span class="tag">${esc(m.status||"")}</span></div><div class="list-item"><div class="main-info"><strong>在庫</strong><small>使用期限：${esc(m.expiry_date||"未設定")}</small></div><span class="stock ${Number(m.stock)<=5?"low":"ok"}">${m.stock??0}${esc(m.unit||"錠")}</span></div><div class="med-meta">服用：${esc(m.timing||"")} / ${esc(m.dose||"")} ${esc(m.unit||"")}</div><div class="med-actions"><button class="btn small secondary" onclick="openMedicationModal('${m.id}')">編集</button><button class="btn small secondary" onclick="logMedicationDirect('${m.id}')">服薬記録</button><button class="btn small secondary" onclick="deleteMedication('${m.id}')">削除</button></div></article>`).join("")||'<div class="empty">おくすりが登録されていません。</div>';
}
window.openMedicationModal=openMedicationModal;
window.logMedicationDirect=id=>openLogModal(id);
window.deleteMedication=async id=>{if(!confirm("このおくすりを削除しますか？"))return;try{await db("medications","delete",null,{eq:{id}});await loadMedications();renderMedications();renderDashboard();toast("削除しました。")}catch(e){showError(e)}}

function openLogModal(defaultMed=null){
  openModal(`<h3>服薬を記録</h3><form id="log-modal-form" class="modal-form"><label>おくすり<select id="l-med">${state.medications.map(m=>`<option value="${m.id}" ${m.id===defaultMed?"selected":""}>${esc(m.name)} ${esc(m.strength||"")}</option>`).join("")}</select></label><div class="grid2"><label>服用量<input id="l-dose" required placeholder="1"></label><label>単位<input id="l-unit" value="錠"></label></div><div class="grid2"><label>日時<input id="l-time" type="datetime-local" value="${new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)}"></label><label>タイミング<select id="l-timing"><option>朝</option><option>昼</option><option>夕</option><option>寝る前</option><option>その他</option></select></label></div><label>メモ<textarea id="l-note" rows="3"></textarea></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">キャンセル</button><button class="btn primary">記録する</button></div></form>`);
  $("log-modal-form").onsubmit=saveLog;
}
async function saveLog(e){
  e.preventDefault();try{
    const mid=val("l-med"),m=state.medications.find(x=>x.id===mid),dose=val("l-dose");
    await db("medication_logs","insert",{user_id:state.user.id,medication_id:mid,medication_name:m?.name||"",dose:`${dose} ${val("l-unit")||""}`.trim(),taken_at:new Date(val("l-time")).toISOString(),timing:val("l-timing"),note:val("l-note")});
    if(m&&Number(m.stock)>0)await db("medications","update",{stock:Number(m.stock)-1},{eq:{id:m.id}});
    closeModal();await Promise.all([loadLogs(),loadMedications()]);renderLogs();renderMedications();renderDashboard();renderStatistics();toast("服薬を記録しました。")
  }catch(e){showError(e)}
}
function renderLogs(){
  const days=Number($("med-log-range").value||7),cut=Date.now()-days*86400000,arr=state.logs.filter(x=>days>=3650||new Date(x.taken_at).getTime()>=cut);
  $("med-logs-list").innerHTML=`<table class="data-table"><thead><tr><th>おくすり</th><th>服用量</th><th>日時</th><th>タイミング</th><th>メモ</th></tr></thead><tbody>${arr.map(l=>`<tr><td>${esc(l.medication_name||medName(l.medication_id))}</td><td>${esc(l.dose||"")}</td><td>${esc(fmtDateTime(l.taken_at))}</td><td>${esc(l.timing||"")}</td><td>${esc(l.note||"")}</td></tr>`).join("")}</tbody></table>`||'<div class="empty">記録はありません。</div>';
}

function openAlarmModal(id=null){
  const a=id?state.alarms.find(x=>x.id===id):null;state.editingId=id;
  openModal(`<h3>${a?"アラームを編集":"服薬アラームを追加"}</h3><form id="alarm-modal-form" class="modal-form"><label>おくすり<select id="a-med">${state.medications.map(m=>`<option value="${m.id}" ${m.id===a?.medication_id?"selected":""}>${esc(m.name)}</option>`).join("")}</select></label><div class="grid2"><label>時刻<input id="a-time" type="time" required value="${esc(a?.time||"08:00")}"></label><label>服用量<input id="a-dose" value="${esc(a?.dose||"1")}" required></label></div><label>タイミング<select id="a-timing"><option>朝</option><option>昼</option><option>夕</option><option>寝る前</option></select></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">キャンセル</button><button class="btn primary">保存する</button></div></form>`);
  $("a-timing").value=a?.timing||"朝";$("alarm-modal-form").onsubmit=saveAlarm;
}
async function saveAlarm(e){e.preventDefault();try{const mid=val("a-med"),m=state.medications.find(x=>x.id===mid),p={user_id:state.user.id,medication_id:mid,medication_name:m?.name||"",time:val("a-time"),timing:val("a-timing"),dose:val("a-dose"),enabled:true};if(state.editingId)await db("medication_alarms","update",p,{eq:{id:state.editingId}});else await db("medication_alarms","insert",p);closeModal();await loadAlarms();renderAlarms();renderDashboard();toast("アラームを保存しました。")}catch(e){showError(e)}}
function renderAlarms(){$("alarms-list").innerHTML=state.alarms.map(a=>`<div class="alarm-card"><div class="time-big">${esc(a.time)}</div><h3>${esc(a.medication_name||medName(a.medication_id))}</h3><div class="muted">${esc(a.timing||"")} ・ ${esc(a.dose||"")} </div><div class="day-pills"><span class="day-pill active">毎日</span></div><div class="med-actions"><button class="btn small secondary" onclick="openAlarmModal('${a.id}')">編集</button><button class="btn small secondary" onclick="deleteAlarm('${a.id}')">削除</button></div></div>`).join("")||'<div class="empty">服薬アラームはありません。</div>'}
window.openAlarmModal=openAlarmModal;window.deleteAlarm=async id=>{if(!confirm("削除しますか？"))return;try{await db("medication_alarms","delete",null,{eq:{id}});await loadAlarms();renderAlarms();renderDashboard();toast("削除しました。")}catch(e){showError(e)}}

function openAppointmentModal(){
  openModal(`<h3>通院予定を追加</h3><form id="appointment-modal-form" class="modal-form"><label>日時<input id="p-time" type="datetime-local" required></label><div class="grid2"><label>病院名<input id="p-hospital"></label><label>診療科<input id="p-dept"></label></div><label>主治医への伝達メモ<textarea id="p-note" rows="5"></textarea></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">キャンセル</button><button class="btn primary">保存する</button></div></form>`);
  $("appointment-modal-form").onsubmit=saveAppointment;
}
async function saveAppointment(e){e.preventDefault();try{await db("appointments","insert",{user_id:state.user.id,scheduled_at:new Date(val("p-time")).toISOString(),hospital_name:val("p-hospital"),department:val("p-dept"),note:val("p-note")});closeModal();await loadAppointments();renderAppointments();renderDashboard();toast("通院予定を保存しました。")}catch(e){showError(e)}}
function renderAppointments(){$("appointments-list").innerHTML=state.appointments.map(a=>`<div class="appointment-card"><div class="appointment-date">${esc(fmtDateTime(a.scheduled_at))}</div><h3>${esc(a.hospital_name||"病院名未設定")}</h3><div class="muted">${esc(a.department||"")} </div><p>${esc(a.note||"")}</p><button class="btn small secondary" onclick="deleteAppointment('${a.id}')">削除</button></div>`).join("")||'<div class="empty">通院予定はありません。</div>'}
window.deleteAppointment=async id=>{if(!confirm("削除しますか？"))return;try{await db("appointments","delete",null,{eq:{id}});await loadAppointments();renderAppointments();renderDashboard();toast("削除しました。")}catch(e){showError(e)}}

function openEncounterModal(){
  openModal(`<h3>受診の記録を追加</h3><form id="enc-modal-form" class="modal-form"><div class="grid2"><label>日付<input id="e-date" type="date" value="${today()}" required></label><label>タイトル<input id="e-title" placeholder="診察・検査など"></label></div><div class="grid2"><label>病院名<input id="e-hospital"></label><label>診療科<input id="e-dept"></label></div><label>記録<textarea id="e-note" rows="6" placeholder="診察内容・検査結果など"></textarea></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">キャンセル</button><button class="btn primary">保存する</button></div></form>`);
  $("enc-modal-form").onsubmit=saveEncounter;
}
async function saveEncounter(e){e.preventDefault();try{await db("medical_encounters","insert",{user_id:state.user.id,encounter_date:val("e-date"),title:val("e-title"),hospital_name:val("e-hospital"),department:val("e-dept"),note:val("e-note")});closeModal();await loadEncounters();renderEncounters();toast("受診記録を追加しました。")}catch(e){showError(e)}}

function renderStatistics(){
  const days=Number($("stats-range").value||7),cut=Date.now()-days*86400000,arr=state.logs.filter(x=>new Date(x.taken_at).getTime()>=cut);
  $("stat-total-doses").textContent=arr.length+"回";$("stat-med-total").textContent=state.medications.length+"種類";$("stat-low-stock").textContent=state.medications.filter(m=>Number(m.stock)<=5).length+"種類";
  const cats={};state.medications.forEach(m=>cats[m.category||"その他"]=(cats[m.category||"その他"]||0)+1);const max=Math.max(1,...Object.values(cats));
  $("classification-chart").innerHTML=Object.entries(cats).map(([k,v])=>`<div class="bar-row"><span>${esc(k)}</span><div class="bar-bg"><div class="bar-fill" style="width:${v/max*100}%"></div></div><strong>${v}</strong></div>`).join("")||'<div class="empty">データなし</div>';
  const ranks={};arr.forEach(l=>{const n=l.medication_name||medName(l.medication_id);ranks[n]=(ranks[n]||0)+1});const sorted=Object.entries(ranks).sort((a,b)=>b[1]-a[1]);
  $("ranking-list").innerHTML=sorted.slice(0,10).map(([n,v],i)=>`<div class="rank-item"><span class="rank-no">${i+1}</span><span>${esc(n)}</span><strong>${v}回</strong></div>`).join("")||'<div class="empty">データなし</div>';
  const low=state.medications.filter(m=>Number(m.stock)<=5);$("stats-low-stock-list").innerHTML=low.map(m=>`<div class="list-item"><div class="main-info"><strong>${esc(m.name)}</strong><small>${esc(m.category||"")}</small></div><span class="stock low">${m.stock??0}${esc(m.unit||"錠")}</span></div>`).join("")||'<div class="empty">在庫が少ないおくすりはありません。</div>';
}

async function searchFriends(){
  const q=val("friend-search");if(!q)return;
  try{
    const rows=await db("profiles","select",null,{ilike:{username:`%${q}%`},limit:20});
    const existing=new Set(state.friends.map(f=>f.friend_id));const req=new Set(state.requests.map(r=>r.receiver_id===state.user.id?r.sender_id:r.receiver_id));
    $("friend-search-results").innerHTML=rows.filter(r=>r.id!==state.user.id).map(r=>`<div class="list-item"><div class="main-info"><strong>${esc(r.username)}</strong></div>${existing.has(r.id)?'<span class="tag">フレンド</span>':req.has(r.id)?'<span class="tag">申請済み</span>':`<button class="btn small primary" onclick="sendFriendRequest('${r.id}')">申請</button>`}</div>`).join("")||'<div class="empty">見つかりませんでした。</div>';
  }catch(e){showError(e)}
}
window.sendFriendRequest=async receiver=>{try{await db("friend_requests","insert",{sender_id:state.user.id,receiver_id:receiver,status:"pending"});await loadRequests();renderRequests();await addNotification(receiver,"friend_request","フレンド申請が届きました。");toast("フレンド申請を送りました。")}catch(e){showError(e)}}
function renderRequests(){
  $("friend-requests").innerHTML=state.requests.map(r=>{
    const incoming=r.receiver_id===state.user.id;
    return `<div class="list-item"><div class="main-info"><strong>${esc(incoming?r.sender_username:r.receiver_username)}</strong><small>${incoming?"あなたへの申請":"送信済み"}</small></div>${incoming?`<div class="friend-actions"><button class="btn small primary" onclick="respondFriend('${r.id}','accepted')">承諾</button><button class="btn small secondary" onclick="respondFriend('${r.id}','rejected')">拒否</button></div>`:`<span class="tag">${esc(r.status)}</span>`}</div>`
  }).join("")||'<div class="empty">フレンド申請はありません。</div>';
}
window.respondFriend=async(id,status)=>{try{await rpc("respond_friend_request",{request_id:id,new_status:status});await Promise.all([loadFriends(),loadRequests()]);renderFriends();renderRequests();toast(status==="accepted"?"フレンドになりました。":"申請を拒否しました。")}catch(e){showError(e)}}
function renderFriends(){
  $("friends-list").innerHTML=state.friends.map(f=>`<div class="friend-card"><div class="friend-head"><div class="avatar">${esc((f.username||"U").charAt(0).toUpperCase())}</div><div><strong>${esc(f.username)}</strong><div class="muted">フレンド</div></div></div><div class="friend-actions"><button class="btn small secondary" onclick="openDm('${f.friend_id}','${esc(f.username)}')">DM</button><button class="btn small primary" onclick="openShare('${f.friend_id}','${esc(f.username)}')">薬を共有</button></div></div>`).join("")||'<div class="empty">フレンドがいません。</div>';
}
async function openDm(friendId,name){
  const messages=await db("direct_messages","select",null,{order:{col:"created_at",asc:true}});
  const relevant=messages.filter(m=>(m.sender_id===state.user.id&&m.receiver_id===friendId)||(m.sender_id===friendId&&m.receiver_id===state.user.id));
  openModal(`<h3>${esc(name)}さんとのDM</h3><div id="dm-messages" style="display:grid;gap:8px;max-height:45vh;overflow:auto;margin-bottom:14px">${relevant.map(m=>`<div style="padding:9px 12px;border-radius:12px;background:${m.sender_id===state.user.id?"#eef1ff":"#f3f5f8"};justify-self:${m.sender_id===state.user.id?"end":"start"};max-width:80%"><div>${esc(m.message)}</div><small class="muted">${esc(fmtDateTime(m.created_at))}</small></div>`).join("")||'<div class="empty">まだメッセージはありません。</div>'}</div><form id="dm-form" class="inline-form"><input id="dm-text" placeholder="メッセージを入力" required><button class="btn primary">送信</button></form>`);
  $("dm-form").onsubmit=async e=>{e.preventDefault();try{await db("direct_messages","insert",{sender_id:state.user.id,receiver_id:friendId,message:val("dm-text")});await addNotification(friendId,"dm","フレンドからDMが届きました。");closeModal();toast("DMを送信しました。");openDm(friendId,name)}catch(e){showError(e)}};
}
async function openShare(friendId,name){
  openModal(`<h3>${esc(name)}さんにおくすりを共有</h3><form id="share-form" class="modal-form"><label>共有するおくすり<select id="share-med">${state.medications.map(m=>`<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></label><label>メッセージ（任意）<textarea id="share-note" rows="3"></textarea></label><div class="modal-actions"><button type="button" class="btn secondary" onclick="closeModal()">キャンセル</button><button class="btn primary">共有する</button></div></form>`);
  $("share-form").onsubmit=async e=>{e.preventDefault();try{const m=state.medications.find(x=>x.id===val("share-med"));await db("shared_medications","insert",{sender_id:state.user.id,recipient_id:friendId,medication_id:m.id,medication_name:m.name,strength:m.strength,photo_url:m.photo_url,note:val("share-note")});await addNotification(friendId,"shared_medication","おくすりが共有されました。");closeModal();toast("おくすりを共有しました。");}catch(e){showError(e)}}
}
function renderShared(){$("shared-medications-list").innerHTML=state.shared.map(s=>`<div class="list-item"><div class="main-info"><strong>${esc(s.medication_name)}</strong><small>${esc(s.strength||"")} ・ ${esc(s.note||"")}</small></div><span class="tag">共有</span></div>`).join("")||'<div class="empty">共有されたおくすりはありません。</div>'}

async function addNotification(userId,type,message){
  try{await db("notifications","insert",{user_id:userId,type,message,read:false})}catch(e){console.warn("notification",e)}
}
function renderNotifications(){
  const n=state.notifications;const unread=n.filter(x=>!x.read).length;
  $("notification-badge").textContent=unread;$("notification-badge").classList.toggle("hidden",!unread);$("top-notification-dot").classList.toggle("hidden",!unread);
  $("notifications-list").innerHTML=n.map(x=>`<div class="notification-item ${x.read?"":"unread"}"><div class="notification-icon">●</div><div><strong>${esc(x.type||"通知")}</strong><p>${esc(x.message)}</p><time>${esc(fmtDateTime(x.created_at))}</time></div></div>`).join("")||'<div class="empty">通知はありません。</div>';
}
async function markAllRead(){try{for(const n of state.notifications.filter(x=>!x.read))await db("notifications","update",{read:true},{eq:{id:n.id}});await loadNotifications();renderNotifications();toast("すべて既読にしました。")}catch(e){showError(e)}}
async function requestBrowserNotification(){if(!("Notification" in window))return toast("このブラウザは通知に対応していません。","error");const p=await Notification.requestPermission();toast(p==="granted"?"通知を許可しました。":"通知は許可されませんでした。",p==="granted"?"success":"error")}
let reminderStarted=false;
function startLocalReminderLoop(){
  if(reminderStarted)return;reminderStarted=true;
  setInterval(async()=>{
    if(!state.user)return;
    const now=new Date(),hh=String(now.getHours()).padStart(2,"0"),mm=String(now.getMinutes()).padStart(2,"0");
    if(mm==="00"&&["06","12","18"].includes(hh)){
      const key=`health-${today()}-${hh}`;if(localStorage.getItem(key)!=="1"){localStorage.setItem(key,"1");pushBrowser("体調管理","今日の体調を記録しましょう。")}
    }
    for(const a of state.alarms){if(a.enabled!==false&&a.time===`${hh}:${mm}`){const key=`alarm-${a.id}-${today()}`;if(localStorage.getItem(key)!=="1"){localStorage.setItem(key,"1");pushBrowser("服薬アラーム",`${a.medication_name||medName(a.medication_id)} ${a.dose||""} を服用する時間です。`)}}}
  },30000);
}
function pushBrowser(title,body){if("Notification" in window&&Notification.permission==="granted")new Notification(title,{body});}

init();
