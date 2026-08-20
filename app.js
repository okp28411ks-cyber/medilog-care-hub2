// --- 1. Supabase 初期化 ---
const SUPABASE_URL = 'https://ufmcloqjcolpvzhnobgg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_mxebX3u8pw2XfPGwtzQmyg_aB2fUSWy';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. DOM要素の取得 ---
const cardContainer = document.getElementById('cardContainer');
const mainForm = document.getElementById('mainForm');
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtns = document.querySelectorAll('.close-modal');
const refreshBtn = document.getElementById('refreshBtn');

const statTotal = document.getElementById('statTotal');
const statToday = document.getElementById('statToday');
const statAttention = document.getElementById('statAttention');

// --- 3. 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
  // Lucideアイコンのレンダリング
  if (window.lucide) {
    lucide.createIcons();
  }
  
  // 初期データ取得
  fetchCareLogs();

  // イベントリスナーの登録
  setupEventListeners();
});

// --- 4. イベントリスナーの設定 ---
function setupEventListeners() {
  // モーダル開閉
  openModalBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modal.style.display = 'none';
      mainForm.reset();
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      mainForm.reset();
    }
  });

  // 手動更新ボタン
  refreshBtn.addEventListener('click', fetchCareLogs);

  // フォーム送信（データ挿入）
  mainForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value;

    await createCareLog({ title, category, notes });
  });
}

// --- 5. Supabase API連携処理 ---

// 記録取得・一覧描画
async function fetchCareLogs() {
  cardContainer.innerHTML = '<p class="loading-text">データを読み込み中...</p>';

  const { data, error } = await supabase
    .from('care_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('データ取得エラー:', error);
    cardContainer.innerHTML = '<p class="loading-text">データの読み込みに失敗しました。</p>';
    return;
  }

  renderLogs(data);
  updateStats(data);
}

// 記録新規作成
async function createCareLog(logData) {
  const { data, error } = await supabase
    .from('care_logs')
    .insert([logData]);

  if (error) {
    console.error('データ挿入エラー:', error);
    alert('保存に失敗しました。');
    return;
  }

  // 成功処理
  modal.style.display = 'none';
  mainForm.reset();
  fetchCareLogs();
}

// 記録削除
async function deleteCareLog(id) {
  if (!confirm('この記録を削除しますか？')) return;

  const { error } = await supabase
    .from('care_logs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('データ削除エラー:', error);
    alert('削除に失敗しました。');
    return;
  }

  fetchCareLogs();
}

// --- 6. 画面描画ユーティリティ ---

// カード要素の生成と表示
function renderLogs(logs) {
  if (!logs || logs.length === 0) {
    cardContainer.innerHTML = '<p class="loading-text">記録が存在しません。</p>';
    return;
  }

  cardContainer.innerHTML = logs.map((log) => {
    const date = new Date(log.created_at).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="card">
        <div>
          <div class="card-header-row">
            <span class="badge">${escapeHtml(log.category)}</span>
            <span class="card-time">${date}</span>
          </div>
          <h3 class="card-title">${escapeHtml(log.title)}</h3>
          <p class="card-notes">${escapeHtml(log.notes)}</p>
        </div>
        <div class="card-footer">
          <button class="btn-danger-text" onclick="deleteCareLog(${log.id})">削除</button>
        </div>
      </div>
    `;
  }).join('');
}

// 上部ステータスボードの集計更新
function updateStats(logs) {
  if (!logs) return;

  // 総記録数
  statTotal.textContent = logs.length;

  // 本日の記録数
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = logs.filter((log) => {
    const logDateStr = new Date(log.created_at).toISOString().split('T')[0];
    return logDateStr === todayStr;
  }).length;
  statToday.textContent = todayCount;

  // 要対応数（経過観察の件数を参考値としてカウント）
  const attentionCount = logs.filter((log) => log.category === '経過観察').length;
  statAttention.textContent = attentionCount;
}

// XSS防止エスケープ処理
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return escapeMap[match];
  });
}
