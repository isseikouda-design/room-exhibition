/* ==========================
   設定
========================== */
const PI_BASE = 'https://aud-soft-power-seeds.trycloudflare.com';


/* ==========================
   Piログ1行の整形（JSTそのまま表示・最終確定）
========================== */
function formatLine(item) {
  if (!item || !item.word || !item.time) return '';

  // ★ Pi 側ですでに JST。Date変換しない
  const t = item.time;

  const word =
    item.word === 'howareyou' ? 'how-are-you' : item.word;

  return `[${t}] ${word}`;
}




/* ==========================
   ログ描画（確定ログ）
========================== */
function renderLog(items) {
  const logEl = document.getElementById('log');
  if (!logEl) return;

  const frag = document.createDocumentFragment();

  items
    .map(formatLine)
    .filter(Boolean)
    .forEach(text => {
      const div = document.createElement('div');
      div.textContent = text;
      frag.appendChild(div);
    });

  logEl.replaceChildren(frag);
  logEl.scrollTop = logEl.scrollHeight;
}

/* ==========================
   仮ログ（即時表示）
========================== */
function renderInstant(word) {
  const logEl = document.getElementById('log');
  if (!logEl) return;

  const div = document.createElement('div');
  div.textContent = `[sending…] ${word}`;
  div.className = 'pending';
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

/* ==========================
   Pi からログ取得
========================== */
async function fetchLog() {
  try {
    const res = await fetch(`${PI_BASE}/log`);
    const data = await res.json();
    renderLog(data);
  } catch (err) {
    console.error('log fetch error', err);
  }
}

/* ==========================
   ボタン処理（PC / SP 共通）
========================== */
function setupButtons() {
  const buttons = document.querySelectorAll(
    '#buttons button, #buttonsSp button'
  );

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const raw = btn.dataset.word;
      const word = raw.replace(/-/g, '');

      renderInstant(raw);

      try {
        await fetch(`${PI_BASE}/${word}`);
      } catch (err) {
        console.error('send error', err);
      }

      setTimeout(fetchLog, 500);
    });
  });
}

/* ==========================
   初期化
========================== */
window.addEventListener('DOMContentLoaded', () => {
  setupButtons();
  fetchLog();
});
