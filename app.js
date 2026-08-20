document.addEventListener('DOMContentLoaded', () => {
  // --- 1. フォーム送信ハンドラー ---
  const mainForm = document.getElementById('mainForm');
  
  if (mainForm) {
    mainForm.addEventListener('submit', (event) => {
      event.preventDefault(); // ページリロードを防止
      
      const formData = new FormData(mainForm);
      const data = Object.fromEntries(formData.entries());
      
      console.log('送信データ:', data);
      
      // 送信成功時の簡易フィードバック処理
      alert('データを保存しました。');
      mainForm.reset();
    });
  }

  // --- 2. モーダル表示 / 非表示切り替え ---
  const modal = document.getElementById('modal');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtns = document.querySelectorAll('.close-modal');

  if (modal && openModalBtn) {
    openModalBtn.addEventListener('click', () => {
      modal.classList.add('is-active');
      modal.style.display = 'flex';
    });

    closeModalBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modal.classList.remove('is-active');
        modal.style.display = 'none';
      });
    });

    // モーダルの背景（外側）クリックで閉じる
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.classList.remove('is-active');
        modal.style.display = 'none';
      }
    });
  }

  // --- 3. カード要素の動的削除イベント ---
  const cardContainer = document.getElementById('cardContainer');

  if (cardContainer) {
    cardContainer.addEventListener('click', (event) => {
      // 削除ボタン（.btn-delete）が押された場合
      if (event.target.classList.contains('btn-delete')) {
        const card = event.target.closest('.card');
        if (card && confirm('この項目を削除してもよろしいですか？')) {
          card.remove();
        }
      }
    });
  }
});

/**
 * 4. API連携用ユーティリティ関数（非同期データ取得例）
 * @param {string} url - 取得先APIのURL
 */
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('データ取得エラー:', error);
  }
}
