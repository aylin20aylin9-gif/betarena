// ==========================================================
// لعبة الروليت الأوروبية — نظام نقاط داخلي (Game Points) فقط
// بدون أي فلوس حقيقية، بدون شراء نقاط، بدون ربط بوسائل دفع
// ملاحظة: الحساب والعشوائية تتم بالكامل داخل المتصفح (Frontend)
// لأن الموقع مستضاف كملفات ثابتة بدون سيرفر خلفي
// ==========================================================

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const CHIP_VALUES = [1, 5, 25, 100, 500, 1000];
const ROW1 = [3,6,9,12,15,18,21,24,27,30,33,36];
const ROW2 = [2,5,8,11,14,17,20,23,26,29,32,35];
const ROW3 = [1,4,7,10,13,16,19,22,25,28,31,34];

function numColor(n) {
  if (n === 0) return 'green';
  return RED_NUMBERS.has(n) ? 'red' : 'black';
}

Router.register('roulette', (app) => {
  const user = Store.get('user', { name: 'مستخدم', points: 0 });
  if (typeof user.points !== 'number') user.points = 0;

  let bets = {};
  let undoStack = [];
  let activeChip = CHIP_VALUES[0];
  let spinning = false;
  let lastWin = 0;
  let results = Store.get('roulette_results', []);

  render();

  function totalBet() {
    return Object.values(bets).reduce((a, b) => a + b, 0);
  }

  function render() {
    app.innerHTML = `
      <div class="rl-page">
        <div class="rl-top-bar">
          <button class="rl-icon-btn" id="rl-info-btn">ℹ️</button>
          <button class="rl-icon-btn" id="rl-history-btn">🕓</button>
          <button class="rl-icon-btn" id="rl-back-btn">🏠</button>
        </div>

        <div class="rl-wheel-area">
          <div class="wheel-wrap">
            <div class="wheel-pointer">▼</div>
            <div class="wheel" id="rl-wheel" style="background:${buildWheelGradient()}"></div>
            <div class="wheel-hub"></div>
          </div>
        </div>

        <div class="rl-info-row">
          <div class="rl-panel">
            <div class="rl-panel-label">الرصيد</div>
            <div class="rl-panel-value gold">${user.points}</div>
            <div class="rl-panel-label" style="margin-top:8px;">مجموع الرهان</div>
            <div class="rl-panel-value">${totalBet()}</div>
            <div class="rl-panel-label" style="margin-top:8px;">آخر ربح</div>
            <div class="rl-panel-value green">${lastWin}</div>
          </div>

          <div class="rl-panel">
            <div class="rl-panel-label">آخر النتائج</div>
            <div class="rl-results-row" id="rl-results-row">
              ${renderResultsRow()}
            </div>
            <div class="rl-panel-label" style="margin-top:8px;">الإحصائيات</div>
            ${renderStats()}
          </div>
        </div>

        <div class="rl-table-scroll">
          <div class="rl-table">
            <div class="rl-num-grid">
              <div class="rl-zero" data-bet="straight-0">0</div>
              <div class="rl-num-cols">
                ${renderNumRow(ROW1)}
                ${renderNumRow(ROW2)}
                ${renderNumRow(ROW3)}
              </div>
              <div class="rl-col2to1">
                <div class="rl-col-bet" data-bet="column-1">2:1</div>
                <div class="rl-col-bet" data-bet="column-2">2:1</div>
                <div class="rl-col-bet" data-bet="column-3">2:1</div>
              </div>
            </div>

            <div class="rl-dozens">
              <div class="rl-outside" data-bet="dozen-1">1ST 12</div>
              <div class="rl-outside" data-bet="dozen-2">2ND 12</div>
              <div class="rl-outside" data-bet="dozen-3">3RD 12</div>
            </div>

            <div class="rl-outside-row">
              <div class="rl-outside" data-bet="low">1-18</div>
              <div class="rl-outside" data-bet="even">زوجي</div>
              <div class="rl-outside rl-red-cell" data-bet="red">أحمر</div>
              <div class="rl-outside rl-black-cell" data-bet="black">أسود</div>
              <div class="rl-outside" data-bet="odd">فردي</div>
              <div class="rl-outside" data-bet="high">19-36</div>
            </div>
          </div>
        </div>

        <div class="rl-chips-row">
          ${CHIP_VALUES.map(c => `
            <button class="rl-chip ${activeChip === c ? 'active' : ''}" data-chip="${c}">${c}</button>
          `).join('')}
        </div>

        <div class="rl-controls-row">
          <button class="rl-ctrl-btn" id="rl-undo-btn">↩️ تراجع</button>
          <button class="rl-ctrl-btn" id="rl-clear-btn">مسح</button>
          <button class="rl-ctrl-btn rl-double-btn" id="rl-double-btn">×2 مضاعفة</button>
        </div>

        <button class="btn rl-spin-btn" id="rl-spin-btn" ${spinning ? 'disabled' : ''}>
          ${spinning ? 'جاري الدوران...' : '🎡 دوران'}
        </button>
      </div>
    `;

    attachEvents();
    paintBetBadges();
  }

  function renderNumRow(row) {
    return `<div class="rl-num-row">
      ${row.map(n => `<div class="rl-num-cell num-${numColor(n)}" data-bet="straight-${n}">${n}</div>`).join('')}
    </div>`;
  }

  function renderResultsRow() {
    if (results.length === 0) {
      return `<span style="color:#666; font-size:12px;">لا توجد نتائج بعد</span>`;
    }
    return results.slice(0, 5).map(r => `
      <div class="rl-result-ball rl-ball-${r.color}">${r.num}</div>
    `).join('');
  }

  function renderStats() {
    const total = results.length || 1;
    const redCount = results.filter(r => r.color === 'red').length;
    const blackCount = results.filter(r => r.color === 'black').length;
    const greenCount = results.filter(r => r.color === 'green').length;
    const redPct = Math.round((redCount / total) * 100);
    const blackPct = Math.round((blackCount / total) * 100);
    const greenPct = Math.round((greenCount / total) * 100);

    return `
      <div class="rl-stat-bar">
        <div class="rl-stat-fill red" style="width:${redPct}%;"></div>
        <div class="rl-stat-fill black" style="width:${blackPct}%;"></div>
      </div>
      <div class="rl-stat-labels">
        <span class="red-text">أحمر ${redPct}%</span>
        <span>أسود ${blackPct}%</span>
      </div>
      <div class="rl-stat-labels">
        <span class="green-text">أخضر ${greenPct}%</span>
      </div>
    `;
  }

  function buildWheelGradient() {
    const segAngle = 360 / WHEEL_ORDER.length;
    const stops = WHEEL_ORDER.map((n, i) => {
      const color = numColor(n) === 'red' ? '#c1272d' : (numColor(n) === 'black' ? '#1a1a1a' : '#1f7a3f');
      const start = i * segAngle;
      const end = start + segAngle;
      return `${color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  function attachEvents() {
    document.getElementById('rl-back-btn').addEventListener('click', () => Router.navigate('home'));
    document.getElementById('rl-info-btn').addEventListener('click', showInfo);
    document.getElementById('rl-history-btn').addEventListener('click', showHistory);

    document.querySelectorAll('.rl-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeChip = Number(btn.dataset.chip);
        document.querySelectorAll('.rl-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.querySelectorAll('[data-bet]').forEach(cell => {
      cell.addEventListener('click', () => {
        if (spinning) return;
        placeBet(cell.dataset.bet);
      });
    });

    document.getElementById('rl-undo-btn').addEventListener('click', undoLast);
    document.getElementById('rl-clear-btn').addEventListener('click', clearBets);
    document.getElementById('rl-double-btn').addEventListener('click', doubleBets);
    document.getElementById('rl-spin-btn').addEventListener('click', spin);
  }

  function placeBet(key) {
    if (user.points < activeChip) {
      flashMessage('رصيدك غير كافٍ');
      return;
    }
    user.points -= activeChip;
    bets[key] = (bets[key] || 0) + activeChip;
    undoStack.push({ key, amount: activeChip });
    Store.set('user', user);
    render();
  }

  function undoLast() {
    if (spinning) return;
    const last = undoStack.pop();
    if (!last) return;
    bets[last.key] -= last.amount;
    if (bets[last.key] <= 0) delete bets[last.key];
    user.points += last.amount;
    Store.set('user', user);
    render();
  }

  function clearBets() {
    if (spinning) return;
    const refund = totalBet();
    user.points += refund;
    bets = {};
    undoStack = [];
    Store.set('user', user);
    render();
  }

  function doubleBets() {
    if (spinning) return;
    const currentTotal = totalBet();
    if (currentTotal === 0) {
      flashMessage('ضع رهانًا أولاً');
      return;
    }
    if (user.points < currentTotal) {
      flashMessage('رصيدك غير كافٍ للمضاعفة');
      return;
    }
    user.points -= currentTotal;
    Object.keys(bets).forEach(k => {
      const addAmount = bets[k];
      bets[k] += addAmount;
      undoStack.push({ key: k, amount: addAmount });
    });
    Store.set('user', user);
    render();
  }

  function paintBetBadges() {
    Object.entries(bets).forEach(([key, amount]) => {
      const cell = document.querySelector(`[data-bet="${key}"]`);
      if (!cell) return;
      const badge = document.createElement('div');
      badge.className = 'rl-bet-badge';
      badge.textContent = amount;
      cell.appendChild(badge);
    });
  }

  function flashMessage(msg) {
    const el = document.createElement('div');
    el.className = 'rl-flash-msg';
    el.textContent = msg;
    document.querySelector('.rl-page').appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function spin() {
    if (spinning) return;
    if (totalBet() === 0) {
      flashMessage('ضع رهانًا واحدًا على الأقل');
      return;
    }
    spinning = true;

    const winningNumber = Math.floor(Math.random() * 37);
    const winIndex = WHEEL_ORDER.indexOf(winningNumber);
    const segAngle = 360 / WHEEL_ORDER.length;
    const segmentCenter = winIndex * segAngle + segAngle / 2;
    const extraSpins = 6 * 360;
    const finalRotation = extraSpins + (360 - segmentCenter);

    render();

    const wheel = document.getElementById('rl-wheel');
    requestAnimationFrame(() => {
      wheel.style.transition = 'transform 4s cubic-bezier(0.15, 0.65, 0.25, 1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });

    setTimeout(() => resolveSpin(winningNumber), 4200);
  }

  function resolveSpin(winningNumber) {
    const color = numColor(winningNumber);
    let winnings = 0;

    Object.entries(bets).forEach(([key, amount]) => {
      winnings += evaluateBet(key, amount, winningNumber, color);
    });

    user.points += winnings;
    lastWin = winnings;
    Store.set('user', user);

    results.unshift({ num: winningNumber, color });
    results = results.slice(0, 20);
    Store.set('roulette_results', results);

    bets = {};
    undoStack = [];
    spinning = false;

    render();
    flashMessage(winnings > 0 ? `فزت! +${winnings} نقطة` : `النتيجة: ${winningNumber} (${colorLabel(color)})`);
  }

  function colorLabel(c) {
    if (c === 'red') return 'أحمر';
    if (c === 'black') return 'أسود';
    return 'أخضر';
  }

  function evaluateBet(key, amount, num, color) {
    const [type, val] = key.split('-');

    if (type === 'straight') {
      return Number(val) === num ? amount * 35 + amount : 0;
    }
    if (type === 'dozen') {
      const d = Number(val);
      const inDozen = (d === 1 && num >= 1 && num <= 12) ||
                       (d === 2 && num >= 13 && num <= 24) ||
                       (d === 3 && num >= 25 && num <= 36);
      return inDozen ? amount * 2 + amount : 0;
    }
    if (type === 'column') {
      const c = Number(val);
      const colArr = c === 1 ? ROW1 : (c === 2 ? ROW2 : ROW3);
      return colArr.includes(num) ? amount * 2 + amount : 0;
    }
    if (key === 'low') return (num >= 1 && num <= 18) ? amount * 2 : 0;
    if (key === 'high') return (num >= 19 && num <= 36) ? amount * 2 : 0;
    if (key === 'even') return (num !== 0 && num % 2 === 0) ? amount * 2 : 0;
    if (key === 'odd') return (num !== 0 && num % 2 === 1) ? amount * 2 : 0;
    if (key === 'red') return color === 'red' ? amount * 2 : 0;
    if (key === 'black') return color === 'black' ? amount * 2 : 0;

    return 0;
  }

  function showInfo() {
    alert(
      'قواعد اللعبة (روليت أوروبية 0-36):\n\n' +
      '• رقم مباشر (Straight): 35:1\n' +
      '• عشرة (Dozen): 2:1\n' +
      '• عمود (Column): 2:1\n' +
      '• أحمر/أسود/زوجي/فردي/1-18/19-36: 1:1\n\n' +
      'الرصيد نقاط داخلية للتسلية فقط، وليست أموالاً حقيقية.'
    );
  }

  function showHistory() {
    if (results.length === 0) {
      alert('لا يوجد سجل جولات بعد');
      return;
    }
    const text = results.slice(0, 15)
      .map((r, i) => `جولة #${results.length - i}: الرقم ${r.num} (${colorLabel(r.color)})`)
      .join('\n');
    alert(text);
  }
});
