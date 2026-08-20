# Create complete app.js file for Medilog Care Hub using Supabase integration

app_js = """/**
 * Medilog Care Hub - Main Application Logic (app.js)
 * Supabase Integration & Full Feature Handler
 */

// --- Supabase Config ---
const SUPABASE_URL = 'https://ufmcloqjcolpvzhnobgg.supabase.co';
// Note: In production, insert your valid Publishable / Anon key below
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbWNsb3FqY29scHZ6aG5vYmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTA0MDAwMH0.placeholder';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let medicinesList = [];

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  checkUserSession();
  setupNotificationTimers();
});

// --- Navigation & Tab Switching ---
function switchTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  
  // Show target tab
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.remove('hidden');
  }

  // Active state for Desktop sidebar
  document.querySelectorAll('.sidebar-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeSidebarBtn = document.getElementById(`nav-${tabId}`);
  if (activeSidebarBtn) activeSidebarBtn.classList.add('active');

  // Active state for Mobile navigation
  document.querySelectorAll('.mobile-nav .mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeMobileBtn = document.getElementById(`mob-${tabId}`);
  if (activeMobileBtn) activeMobileBtn.classList.add('active');
}

// --- Modal Helper ---
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.toggle('hidden');
  }
}

// --- Supabase Authentication ---
async function checkUserSession() {
  const { data: { user } } = await client.auth.getUser();
  if (user) {
    currentUser = user;
    onUserLoggedIn();
  }
}

async function handleAuth(event) {
  event.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  // Try Signing In
  let { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    // If sign in fails, attempt Auto-Sign Up
    const signupResponse = await client.auth.signUp({ email, password });
    if (signupResponse.error) {
      alert('認証エラー: ' + signupResponse.error.message);
      return;
    }
    alert('会員登録を受け付けました。ログインしてください。');
    currentUser = signupResponse.data.user;
  } else {
    currentUser = data.user;
    alert('ログインしました。');
  }

  if (currentUser) {
    onUserLoggedIn();
    toggleModal('auth-modal');
  }
}

function onUserLoggedIn() {
  document.getElementById('login-btn')?.classList.add('hidden');
  document.getElementById('logout-btn')?.classList.remove('hidden');
  document.getElementById('welcome-msg').innerText = `おかえりなさい、${currentUser.email.split('@')[0]} さん`;
  
  // Load data
  fetchMedicines();
  fetchProfile();
}

async function logout() {
  await client.auth.signOut();
  currentUser = null;
  location.reload();
}

// --- 2 & 3. 体調管理 (Daily Log) ---
async function saveDailyLog(event) {
  event.preventDefault();
  if (!currentUser) {
    alert('ログインしてください');
    toggleModal('auth-modal');
    return;
  }

  const logData = {
    user_id: currentUser.id,
    log_date: new Date().toISOString().split('T')[0],
    bp_morning: document.getElementById('bp-morning').value,
    bp_noon: document.getElementById('bp-noon').value,
    bp_night: document.getElementById('bp-night').value,
    wake_time: document.getElementById('wake-time').value || null,
    sleep_time: document.getElementById('sleep-time').value || null,
    diary: document.getElementById('daily-diary').value
  };

  const { error } = await client.from('daily_logs').upsert([logData]);

  if (error) {
    alert('保存に失敗しました: ' + error.message);
  } else {
    alert('本日の体調ログを保存しました！');
  }
}

// --- 5. おくすり在庫管理 ---
async function fetchMedicines() {
  if (!currentUser) return;

  const { data, error } = await client
    .from('medicines')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('おくすり取得エラー:', error);
    return;
  }

  medicinesList = data || [];
  renderMedicines();
  populateMedicineDropdown();
  checkLowStock();
}

function renderMedicines() {
  const container = document.getElementById('medicine-grid');
  if (!container) return;

  if (medicinesList.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-sm col-span-2">登録されているおくすりがありません。</p>';
    return;
  }

  container.innerHTML = medicinesList.map(med => `
    <div class="glass-card p-4 space-y-3 relative">
      <div class="flex justify-between items-start">
        <div>
          <span class="badge badge-teal mb-1">${med.classification || '一般'}</span>
          <h4 class="font-bold text-lg text-slate-800">${escapeHtml(med.name)}</h4>
        </div>
        <span class="text-sm font-semibold ${med.stock_count <= 3 ? 'text-rose-500' : 'text-slate-600'}">
          在庫: ${med.stock_count}
        </span>
      </div>
      ${med.photo_url ? `<img src="${escapeHtml(med.photo_url)}" alt="${escapeHtml(med.name)}" class="w-full h-32 object-cover rounded-xl border">` : ''}
      <div class="flex gap-2">
        <button onclick="takeDoseDirect('${med.id}')" class="btn btn-primary text-xs w-full py-2">
          <i data-lucide="check" class="w-3.5 h-3.5"></i> 1回服用
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

async function addMedicine(event) {
  event.preventDefault();
  if (!currentUser) return alert('ログインが必要です');

  const newMed = {
    user_id: currentUser.id,
    name: document.getElementById('med-name').value,
    classification: document.getElementById('med-classification').value,
    stock_count: parseInt(document.getElementById('med-stock').value) || 0,
    photo_url: document.getElementById('med-photo').value || null
  };

  const { error } = await client.from('medicines').insert([newMed]);

  if (error) {
    alert('おくすりの追加に失敗しました: ' + error.message);
  } else {
    alert('新しいおくすりを登録しました！');
    toggleModal('medicine-modal');
    document.getElementById('add-medicine-form').reset();
    fetchMedicines();
  }
}

function populateMedicineDropdown() {
  const select = document.getElementById('dose-medicine-select');
  if (!select) return;

  select.innerHTML = '<option value="">おくすりを選択...</option>' + 
    medicinesList.map(med => `<option value="${med.id}">${escapeHtml(med.name)} (残: ${med.stock_count})</option>`).join('');
}

// --- 6. 服薬記録 ---
async function recordDose(event) {
  event.preventDefault();
  if (!currentUser) return alert('ログインが必要です');

  const medId = document.getElementById('dose-medicine-select').value;
  const dosage = document.getElementById('dose-amount').value;
  const timing = document.getElementById('dose-timing').value;
  const notes = document.getElementById('dose-notes').value;

  if (!medId) return alert('おくすりを選択してください');

  const { error } = await client.from('dose_logs').insert([{
    user_id: currentUser.id,
    medicine_id: medId,
    dosage: dosage,
    timing: timing,
    notes: notes
  }]);

  if (error) {
    alert('服薬記録に失敗しました: ' + error.message);
  } else {
    // Reduce Stock Count
    const targetMed = medicinesList.find(m => m.id === medId);
    if (targetMed && targetMed.stock_count > 0) {
      await client.from('medicines').update({ stock_count: targetMed.stock_count - 1 }).eq('id', medId);
    }
    alert('服薬を記録しました');
    document.getElementById('dose-record-form').reset();
    fetchMedicines();
  }
}

async function takeDoseDirect(medId) {
  if (!currentUser) return alert('ログインが必要です');
  
  const targetMed = medicinesList.find(m => m.id === medId);
  if (!targetMed) return;

  const { error } = await client.from('dose_logs').insert([{
    user_id: currentUser.id,
    medicine_id: medId,
    dosage: '1回分',
    timing: '手動記録',
  }]);

  if (!error && targetMed.stock_count > 0) {
    await client.from('medicines').update({ stock_count: targetMed.stock_count - 1 }).eq('id', medId);
    alert(`${targetMed.name} の服用を記録しました (在庫: ${targetMed.stock_count - 1})`);
    fetchMedicines();
  }
}

// --- 4. 自身記録 & プロフィール ---
async function fetchProfile() {
  if (!currentUser) return;

  const { data } = await client.from('profiles').select('*').eq('id', currentUser.id).single();

  if (data) {
    document.getElementById('profile-gender').value = data.gender || '男';
    document.getElementById('profile-age').value = data.age || '';
    document.getElementById('profile-height').value = data.height || '';
    document.getElementById('profile-weight').value = data.weight || '';
    document.getElementById('profile-allergies').value = data.allergies || '';
    document.getElementById('profile-conditions').value = data.conditions || '';
  }
}

async function saveProfile(event) {
  event.preventDefault();
  if (!currentUser) return alert('ログインが必要です');

  const profileData = {
    id: currentUser.id,
    gender: document.getElementById('profile-gender').value,
    age: parseInt(document.getElementById('profile-age').value) || null,
    height: parseFloat(document.getElementById('profile-height').value) || null,
    weight: parseFloat(document.getElementById('profile-weight').value) || null,
    allergies: document.getElementById('profile-allergies').value,
    conditions: document.getElementById('profile-conditions').value
  };

  const { error } = await client.from('profiles').upsert([profileData]);

  if (error) alert('プロフィール保存エラー: ' + error.message);
  else alert('プロフィールを更新しました！');
}

// --- 11. 通知 & アラーム設定 ---
function setupNotificationTimers() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

function checkLowStock() {
  const lowStockContainer = document.getElementById('low-stock-list');
  if (!lowStockContainer) return;

  const lowStockMeds = medicinesList.filter(m => m.stock_count <= 3);

  if (lowStockMeds.length === 0) {
    lowStockContainer.innerHTML = '<p class="text-slate-500 text-xs">現在、在庫の少ないおくすりはありません。</p>';
  } else {
    lowStockContainer.innerHTML = lowStockMeds.map(m => `
      <div class="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex justify-between items-center">
        <span>⚠️ <strong>${escapeHtml(m.name)}</strong> の在庫が残りわずかです</span>
        <span class="font-bold">残 ${m.stock_count}</span>
      </div>
    `).join('');
  }
}

// --- Utility Functions ---
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, match => {
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return escapeMap[match];
  });
}
"""

with open("app.js", "w", encoding="utf-8") as f:
    f.write(app_js.strip())

print("app.js created successfully")
