/* ==========================
   設定
========================== */
const PI_BASE = 'https://aud-soft-power-seeds.trycloudflare.com';

/* ==========================
   Piログ1行の整形（UTC → JST）
========================== */
function formatLine(item) {
  if (!item || !item.word || !item.time) return '';

  const d = new Date(item.time.endsWith('Z') ? item.time : item.time + 'Z');
  if (isNaN(d)) return '';

  const formatted = d.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const word = item.word === 'howareyou' ? 'how-are-you' : item.word;

  return `[${formatted.replace(/\//g, '-').replace(',', '')}] ${word}`;
}

/* ==========================
   ログ描画
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
  const buttons = document.querySelectorAll('#buttons button, #buttonsSp button');

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const raw = btn.dataset.word;
      const word = raw.replace(/-/g, '');

      renderInstant(raw);

      if (word === 'hello') startBreath();
      if (word === 'howareyou') startFlutter();

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
   hello：breath（半円）
========================== */
let breathing = false;

function drawBulge(t) {
  const maxH = 32;
  const h = maxH * t;

  return `
    M 0,50
    Q 50,${50 - h} 100,50
  `;
}
function setBreathIdle() {
  const path = document.getElementById('breathPath');
  path.setAttribute('d', drawBulge(0));
}

function startBreath() {
  if (breathing) return;
  breathing = true;

  const path = document.getElementById('breathPath');
  const duration = 15000;
  const start = performance.now();

  function animate(now) {
    const p = Math.min((now - start) / duration, 1);
    const t = Math.sin(Math.PI * p);

    path.setAttribute('d', drawBulge(t));

    if (p < 1) {
      requestAnimationFrame(animate);
   } else {
  path.setAttribute('d', drawBulge(0));
  breathing = false;
}
  }

  requestAnimationFrame(animate);
}
/* ==========================
   paper 位置・サイズ調整
========================== */

const EDGE_X = 69.5;

const PAPER_TOP_Y = 60;
const PAPER_LENGTH = 300;

const END_THRESHOLD = 0.5; // ★ 追加：終了判定用

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function setPaperIdle() {
  const path = document.getElementById('paperPath');

  path.setAttribute(
    'd',
    `M ${EDGE_X},${PAPER_TOP_Y}
     L ${EDGE_X},${PAPER_TOP_Y + PAPER_LENGTH}`
  );
}

/* ==========================
   paper：揺れ描画
========================== */
let currentInward = 0;

function drawFlutter(now, progress) {
  const baseInward = 18;
  const flutterAmp = 10;

  const ease = easeInOut(progress);

  const sway =
    Math.sin(now * 0.0006) * 6 +
    Math.sin(now * 0.0023 + 1.7) * 2;

  const targetInward =
    ease * baseInward +
    sway * ease;

  const baseSmooth = 0.04;
  const smooth = baseSmooth * (0.5 + 0.5 * ease);

  currentInward += (targetInward - currentInward) * smooth;

  const inwardBottom = Math.max(currentInward, ease * baseInward);

  const topX = EDGE_X;
  const topY = PAPER_TOP_Y;

  const bottomX = EDGE_X - inwardBottom;
  const bottomY = PAPER_TOP_Y + PAPER_LENGTH;

  let controlX =
    EDGE_X - inwardBottom * 0.6 +
    flutterAmp * Math.sin(now * 0.0014);

  controlX = Math.min(controlX, EDGE_X);

  const controlY = PAPER_TOP_Y + PAPER_LENGTH * 0.5;

  return `
    M ${topX},${topY}
    Q ${controlX},${controlY} ${bottomX},${bottomY}
  `;
}

/* ==========================
   paper：再生制御
========================== */
let fluttering = false;

function startFlutter() {
  if (fluttering) return;
  fluttering = true;

  const path = document.getElementById('paperPath');
  const start = performance.now();
  const duration = 15000;
  const fadeTime = 1500;

  function animate(now) {
    const elapsed = now - start;

    let progress = 1;

    if (elapsed < fadeTime) {
      progress = elapsed / fadeTime;
    } else if (elapsed > duration - fadeTime) {
      progress = (duration - elapsed) / fadeTime;
    }

    progress = Math.max(0, Math.min(1, progress));

    path.setAttribute('d', drawFlutter(now, progress));

    // ★ 終了条件を「位置ベース」に変更
    if (elapsed < duration || currentInward > END_THRESHOLD) {
      requestAnimationFrame(animate);
    } else {
      currentInward = 0;
      setPaperIdle();
      fluttering = false;
    }
  }

  requestAnimationFrame(animate);
}

/* ==========================
   初期化
========================== */
window.addEventListener('DOMContentLoaded', () => {
  setupButtons();
  fetchLog();
  setPaperIdle();
  setBreathIdle();   // ← 追加
});
