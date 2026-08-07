// ==========================================================
// لعبة الدومينو الكلاسيكية — 4 لاعبين (أنت + 3 لاعبين آليين)
// نظام نقاط داخلي (Game Points) فقط للتسلية — بدون أموال حقيقية
// كل الحساب والعشوائية داخل المتصفح لأن الموقع بدون سيرفر خلفي
// ==========================================================

const DM_MAX_PIP = 6;      // دومينو مزدوج-6 (28 قطعة)
const DM_HAND_SIZE = 6;    // عدد القطع بيد كل لاعب عند التوزيع
const DM_MATCH_ROUNDS = 5; // عدد جولات المباراة
const DM_NAMES = ['أنت', 'اللاعب 1', 'اللاعب 2', 'اللاعب 3'];
const DM_WIN_BONUS = 300;  // نقاط مكافأة عند فوزك بالمباراة
const DM_PLAY_BONUS = 50;  // نقاط مكافأة عند مشاركتك بمباراة كاملة

function dmBuildSet() {
  const set = [];
  for (let a = 0; a <= DM_MAX_PIP; a++) {
    for (let b = a; b <= DM_MAX_PIP; b++) {
      set.push({ a, b, id: `${a}-${b}` });
    }
  }
  return set;
}

function dmShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dmPipHTML(n) {
  const POS = {
    tl: [18, 22], tr: [18, 78], ml: [50, 22], mr: [50, 78],
    bl: [82, 22], br: [82, 78], c: [50, 50]
  };
  const PATTERNS = {
    0: [],
    1: ['c'],
    2: ['tl', 'br'],
    3: ['tl', 'c', 'br'],
    4: ['tl', 'tr', 'bl', 'br'],
    5: ['tl', 'tr', 'c', 'bl', 'br'],
    6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
  };
  const dots = (PATTERNS[n] || []).map(k => {
    const [top, left] = POS[k];
    return `<span class="dm-dot" style="top:${top}%; left:${left}%;"></span>`;
  }).join('');
  return `<div class="dm-pips">${dots}</div>`;
}

Router.register('domino', (app) => {
  const user = Store.get('user', { name: 'مستخدم', points: 0 });
  if (typeof user.points !== 'number') user.points = 0;

  let st = null;         // حالة اللعبة الكاملة
  let selectedId = null; // القطعة المختارة من يدك
  let awaitingSide = false; // بانتظار اختيار يسار/يمين
  let busy = false;      // قفل أثناء دور اللاعبين الآليين أو الرسوم المتحركة
  let logEntries = [];
  let chatDraft = '';

  startMatch();

  // ---------------- إدارة المباراة والجولات ----------------

  function startMatch() {
    st = {
      round: 1,
      scores: [0, 0, 0, 0],
      turn: 0,
      chain: [],
      leftEnd: null,
      rightEnd: null,
      hands: [[], [], [], []],
      boneyard: [],
      passesInRow: 0,
      matchOver: false
    };
    logEntries = [];
    dealRound(true);
  }

  function dealRound(isFirst) {
    const full = dmShuffle(dmBuildSet());
    for (let p = 0; p < 4; p++) {
      st.hands[p] = full.splice(0, DM_HAND_SIZE);
    }
    st.boneyard = full;
    st.chain = [];
    st.leftEnd = null;
    st.rightEnd = null;
    st.passesInRow = 0;
    selectedId = null;
    awaitingSide = false;

    let starter = 0, best = -1;
    for (let p = 0; p < 4; p++) {
      st.hands[p].forEach(t => {
        const score = (t.a === t.b ? 1000 : 0) + t.a + t.b;
        if (score > best) { best = score; starter = p; }
      });
    }
    st.turn = starter;
    addLog(`بدأت الجولة ${st.round} من ${DM_MATCH_ROUNDS} — يبدأ ${DM_NAMES[starter]}`);
    render();
    if (starter !== 0) setTimeout(runAITurn, 700);
  }

  function validSides(tile) {
    if (st.chain.length === 0) return ['any'];
    const sides = [];
    if (tile.a === st.leftEnd || tile.b === st.leftEnd) sides.push('left');
    if (tile.a === st.rightEnd || tile.b === st.rightEnd) sides.push('right');
    return sides;
  }

  function hasValidMove(hand) {
    return hand.some(t => validSides(t).length > 0);
  }

  function playTile(playerIdx, tile, side) {
    const hand = st.hands[playerIdx];
    const idx = hand.findIndex(t => t.id === tile.id);
    if (idx === -1) return;
    hand.splice(idx, 1);

    if (st.chain.length === 0) {
      st.chain.push({ left: tile.a, right: tile.b, id: tile.id });
      st.leftEnd = tile.a;
      st.rightEnd = tile.b;
    } else if (side === 'left') {
      const oriented = tile.a === st.leftEnd
        ? { left: tile.b, right: tile.a, id: tile.id }
        : { left: tile.a, right: tile.b, id: tile.id };
      st.chain.unshift(oriented);
      st.leftEnd = oriented.left;
    } else {
      const oriented = tile.a === st.rightEnd
        ? { left: tile.a, right: tile.b, id: tile.id }
        : { left: tile.b, right: tile.a, id: tile.id };
      st.chain.push(oriented);
      st.rightEnd = oriented.right;
    }

    st.passesInRow = 0;
    addLog(`${DM_NAMES[playerIdx]} وضع [${tile.a}|${tile.b}]`);

    if (hand.length === 0) {
      endRound({ type: 'domino', winner: playerIdx });
      return;
    }
    advanceTurn();
  }

  function drawTile(playerIdx) {
    if (st.boneyard.length === 0) return false;
    const tile = st.boneyard.pop();
    st.hands[playerIdx].push(tile);
    addLog(`${DM_NAMES[playerIdx]} سحب قطعة (${st.boneyard.length} متبقية)`);
    return true;
  }

  function passTurn(playerIdx) {
    st.passesInRow += 1;
    addLog(`${DM_NAMES[playerIdx]} مرّر الدور`);
    if (st.passesInRow >= 4) {
      endRound({ type: 'blocked' });
      return;
    }
    advanceTurn();
  }

  function advanceTurn() {
    selectedId = null;
    awaitingSide = false;
    st.turn = (st.turn + 1) % 4;
    render();
    if (st.turn !== 0 && !st.matchOver) {
      busy = true;
      setTimeout(runAITurn, 750);
    }
  }

  function handPipTotal(hand) {
    return hand.reduce((sum, t) => sum + t.a + t.b, 0);
  }

  function endRound(result) {
    let winner;
    if (result.type === 'domino') {
      winner = result.winner;
      let pts = 0;
      for (let p = 0; p < 4; p++) if (p !== winner) pts += handPipTotal(st.hands[p]);
      st.scores[winner] += pts;
      addLog(`دومينو! ${DM_NAMES[winner]} أنهى الجولة وربح ${pts} نقطة`);
    } else {
      const totals = st.hands.map(handPipTotal);
      winner = totals.indexOf(Math.min(...totals));
      let pts = 0;
      totals.forEach((t, p) => { if (p !== winner) pts += t; });
      st.scores[winner] += pts;
      addLog(`الطاولة مقفلة — ${DM_NAMES[winner]} يربح الجولة بـ ${pts} نقطة`);
    }

    if (st.round >= DM_MATCH_ROUNDS) {
      finishMatch();
    } else {
      st.round += 1;
      busy = true;
      render();
      setTimeout(() => { busy = false; dealRound(false); }, 1800);
    }
  }

  function finishMatch() {
    st.matchOver = true;
    const top = Math.max(...st.scores);
    const winnerIdx = st.scores.indexOf(top);
    addLog(`انتهت المباراة! الفائز: ${DM_NAMES[winnerIdx]} بـ ${top} نقطة`);

    if (winnerIdx === 0) {
      user.points += DM_WIN_BONUS;
      addLog(`فزت بالمباراة! +${DM_WIN_BONUS} نقطة إلى رصيدك`);
    } else {
      user.points += DM_PLAY_BONUS;
      addLog(`مكافأة مشاركة: +${DM_PLAY_BONUS} نقطة`);
    }
    Store.set('user', user);
    render();
  }

  // ---------------- الذكاء الاصطناعي للاعبين ----------------

  function runAITurn() {
    if (st.matchOver) { busy = false; return; }
    const p = st.turn;
    const hand = st.hands[p];

    let guard = 0;
    while (!hasValidMove(hand) && st.boneyard.length > 0 && guard < 30) {
      drawTile(p);
      guard++;
    }

    if (!hasValidMove(hand)) {
      busy = false;
      passTurn(p);
      return;
    }

    let best = null, bestSides = null;
    hand.forEach(t => {
      const sides = validSides(t);
      if (sides.length === 0) return;
      const val = t.a === t.b ? 100 + t.a * 10 : t.a + t.b;
      if (!best || val > (best.a === best.b ? 100 + best.a * 10 : best.a + best.b)) {
        best = t; bestSides = sides;
      }
    });

    const side = bestSides.includes('any') ? 'any' : (bestSides.includes('right') ? 'right' : 'left');
    busy = false;
    playTile(p, best, side);
  }

  // ---------------- الواجهة ----------------

  function addLog(text) {
    logEntries.unshift(text);
    logEntries = logEntries.slice(0, 30);
  }

  function render() {
    const you = st.hands[0];
    const yourTurn = st.turn === 0 && !st.matchOver;

    app.innerHTML = `
      <div class="dm-page">
        <div class="dm-topbar">
          <button class="dm-icon-btn" id="dm-menu-btn">☰</button>
          <div class="dm-info-strip">
            <div class="dm-info-cell"><span class="dm-info-label">الجولة</span><span class="dm-info-val">${st.round}/${DM_MATCH_ROUNDS}</span></div>
            <div class="dm-info-cell"><span class="dm-info-label">المباراة</span><span class="dm-info-val">دومينو كلاسيك</span></div>
            <div class="dm-info-cell"><span class="dm-info-label">النقاط</span><span class="dm-info-val gold">${user.points}</span></div>
          </div>
          <button class="dm-icon-btn" id="dm-score-btn">🏆</button>
        </div>

        <div class="dm-table">
          <div class="dm-seat dm-seat-top">
            ${dmSeatHTML(2)}
          </div>
          <div class="dm-mid-row">
            <div class="dm-seat dm-seat-left">${dmSeatHTML(1)}</div>
            <div class="dm-board-wrap" id="dm-board-wrap">
              <div class="dm-board" id="dm-board">
                ${st.chain.length === 0
                  ? `<div class="dm-board-hint">${yourTurn ? 'اختر قطعة وابدأ الجولة' : 'بانتظار اللاعب...'}</div>`
                  : st.chain.map(t => `<div class="dm-tile dm-tile-board">
                        <div class="dm-half">${dmPipHTML(t.left)}</div>
                        <div class="dm-divider"></div>
                        <div class="dm-half">${dmPipHTML(t.right)}</div>
                      </div>`).join('')}
              </div>
            </div>
            <div class="dm-seat dm-seat-right">${dmSeatHTML(3)}</div>
          </div>
        </div>

        <div class="dm-side-panels">
          <div class="dm-panel">
            <div class="dm-panel-title">سجل اللعبة</div>
            <div class="dm-log">
              ${logEntries.slice(0, 4).map(l => `<div class="dm-log-line">${l}</div>`).join('') || '<div class="dm-log-line dim">لا يوجد سجل بعد</div>'}
            </div>
          </div>
          <div class="dm-panel dm-panel-narrow">
            <div class="dm-panel-title">البطاقات المتبقية</div>
            <div class="dm-stock">🁢 <span>${st.boneyard.length}</span></div>
          </div>
        </div>

        ${awaitingSide ? `
          <div class="dm-side-chooser">
            <span>ضع القطعة على:</span>
            <button class="dm-side-btn" id="dm-side-left">⟵ يسار</button>
            <button class="dm-side-btn" id="dm-side-right">يمين ⟶</button>
          </div>` : ''}

        <div class="dm-hand-wrap">
          ${dmHandRowHTML()}
        </div>

        <div class="dm-controls-row">
          <button class="dm-ctrl-btn" id="dm-draw-btn" ${dmDrawEnabled() ? '' : 'disabled'}>🁢 سحب</button>
          <button class="dm-ctrl-btn" id="dm-undo-btn" ${selectedId ? '' : 'disabled'}>↩️ تراجع</button>
          <button class="dm-ctrl-btn dm-pass-btn" id="dm-pass-btn" ${dmPassEnabled() ? '' : 'disabled'}>مرور</button>
          <button class="dm-ctrl-btn dm-send-btn" id="dm-send-btn" ${dmSendEnabled() ? '' : 'disabled'}>إرسال</button>
        </div>

        ${st.matchOver ? `
          <div class="dm-match-over">
            <div class="dm-match-title">${st.scores.indexOf(Math.max(...st.scores)) === 0 ? '🎉 فزت بالمباراة!' : 'انتهت المباراة'}</div>
            <div class="dm-match-scores">
              ${DM_NAMES.map((n, i) => `<div class="dm-match-score-row"><span>${n}</span><span class="gold">${st.scores[i]}</span></div>`).join('')}
            </div>
            <button class="btn" id="dm-again-btn">مباراة جديدة</button>
            <button class="btn btn-secondary" id="dm-home-btn" style="margin-top:8px;">العودة للرئيسية</button>
          </div>` : ''}
      </div>
    `;

    attachEvents();
  }

  function dmSeatHTML(p) {
    const count = st.hands[p].length;
    const active = st.turn === p && !st.matchOver;
    return `
      <div class="dm-seat-card ${active ? 'active-turn' : ''}">
        <div class="dm-avatar">👤</div>
        <div class="dm-seat-name">${DM_NAMES[p]}</div>
        <div class="dm-seat-score">${st.scores[p]} نقطة</div>
        <div class="dm-seat-count">${count}</div>
      </div>
      <div class="dm-back-tiles">${'🁠'.repeat(Math.min(count, 7))}</div>
    `;
  }

  function dmHandRowHTML() {
    const hand = st.hands[0];
    const yourTurn = st.turn === 0 && !st.matchOver;
    return `<div class="dm-hand-row">
      ${hand.map(t => {
        const sides = yourTurn ? validSides(t) : [];
        const playable = yourTurn && sides.length > 0;
        const isSel = selectedId === t.id;
        return `<div class="dm-tile dm-tile-hand ${isSel ? 'selected' : ''} ${playable ? 'playable' : 'muted'}" data-tile-id="${t.id}">
          <div class="dm-half">${dmPipHTML(t.a)}</div>
          <div class="dm-divider"></div>
          <div class="dm-half">${dmPipHTML(t.b)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function dmDrawEnabled() {
    if (st.matchOver || st.turn !== 0) return false;
    if (hasValidMove(st.hands[0])) return false;
    return st.boneyard.length > 0;
  }

  function dmPassEnabled() {
    if (st.matchOver || st.turn !== 0) return false;
    if (hasValidMove(st.hands[0])) return false;
    return st.boneyard.length === 0;
  }

  function dmSendEnabled() {
    if (st.matchOver || st.turn !== 0 || !selectedId) return false;
    const tile = st.hands[0].find(t => t.id === selectedId);
    if (!tile) return false;
    return validSides(tile).length > 0;
  }

  function attachEvents() {
    const backBtn = document.getElementById('dm-menu-btn');
    if (backBtn) backBtn.addEventListener('click', () => {
      if (confirm('الخروج إلى الرئيسية؟ سيتم فقدان تقدم المباراة الحالية.')) Router.navigate('home');
    });
    const scoreBtn = document.getElementById('dm-score-btn');
    if (scoreBtn) scoreBtn.addEventListener('click', () => {
      alert(DM_NAMES.map((n, i) => `${n}: ${st.scores[i]} نقطة`).join('\n'));
    });

    document.querySelectorAll('.dm-tile-hand').forEach(el => {
      el.addEventListener('click', () => {
        if (st.turn !== 0 || st.matchOver || busy) return;
        const id = el.dataset.tileId;
        const tile = st.hands[0].find(t => t.id === id);
        if (!tile || validSides(tile).length === 0) return;
        selectedId = (selectedId === id) ? null : id;
        awaitingSide = false;
        render();
      });
    });

    const drawBtn = document.getElementById('dm-draw-btn');
    if (drawBtn) drawBtn.addEventListener('click', () => {
      if (!dmDrawEnabled()) return;
      drawTile(0);
      render();
    });

    const undoBtn = document.getElementById('dm-undo-btn');
    if (undoBtn) undoBtn.addEventListener('click', () => {
      selectedId = null;
      awaitingSide = false;
      render();
    });

    const passBtn = document.getElementById('dm-pass-btn');
    if (passBtn) passBtn.addEventListener('click', () => {
      if (!dmPassEnabled()) return;
      passTurn(0);
    });

    const sendBtn = document.getElementById('dm-send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => {
      if (!dmSendEnabled()) return;
      const tile = st.hands[0].find(t => t.id === selectedId);
      const sides = validSides(tile);
      if (sides.includes('any')) {
        playTile(0, tile, 'any');
      } else if (sides.length === 1) {
        playTile(0, tile, sides[0]);
      } else {
        awaitingSide = true;
        render();
      }
    });

    const sideLeft = document.getElementById('dm-side-left');
    if (sideLeft) sideLeft.addEventListener('click', () => {
      const tile = st.hands[0].find(t => t.id === selectedId);
      playTile(0, tile, 'left');
    });
    const sideRight = document.getElementById('dm-side-right');
    if (sideRight) sideRight.addEventListener('click', () => {
      const tile = st.hands[0].find(t => t.id === selectedId);
      playTile(0, tile, 'right');
    });

    const againBtn = document.getElementById('dm-again-btn');
    if (againBtn) againBtn.addEventListener('click', () => startMatch());
    const homeBtn = document.getElementById('dm-home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => Router.navigate('home'));

    const boardWrap = document.getElementById('dm-board-wrap');
    if (boardWrap) boardWrap.scrollLeft = boardWrap.scrollWidth;
  }
});
        
