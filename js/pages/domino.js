// ==========================================================
// لعبة الدومينو الكلاسيكية — واحد ضد واحد (أنت ضد لاعب آلي)
// نظام رهان بنقاط داخلية فقط (Game Points) — بدون أموال حقيقية
// كل الحساب والعشوائية داخل المتصفح لأن الموقع بدون سيرفر خلفي
// ==========================================================

const DM_MAX_PIP = 6;      // دومينو مزدوج-6 (28 قطعة)
const DM_HAND_SIZE = 7;    // توزيع دومينو دولي قياسي لاعبين: 7 قطع لكل لاعب
const DM_NAMES = ['أنت', 'الخصم'];
const DM_STAKES = [10, 25, 50, 100, 250, 350, 500];
const DM_WIN_MULT = 1.8;   // الفائز ياخذ 1.8 × قيمة الرهان

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

  let st = null;           // حالة الجولة الحالية (null = شاشة اختيار الرهان)
  let selectedStake = DM_STAKES[0];
  let logEntries = [];
  let dragInfo = null;     // {tileId, sides, ghostEl, offsetX, offsetY}

  renderSetup();

  // ---------------- شاشة اختيار الرهان ----------------

  function renderSetup() {
    st = null;
    app.innerHTML = `
      <div class="dm-setup-page">
        <div class="dm-setup-header">
          <button class="dm-icon-btn" id="dm-setup-back">🏠</button>
          <div class="dm-setup-title">دومينو 1 ضد 1</div>
        </div>

        <div class="dm-balance-card">
          <div class="dm-panel-title">رصيدك</div>
          <div class="dm-balance-val">${user.points} نقطة</div>
        </div>

        <div class="dm-panel-title" style="margin:14px 0 8px;">اختر قيمة الرهان (نقاط)</div>
        <div class="dm-stake-grid">
          ${DM_STAKES.map(s => `
            <button class="dm-stake-chip ${selectedStake === s ? 'active' : ''} ${user.points < s ? 'disabled' : ''}"
                    data-stake="${s}" ${user.points < s ? 'disabled' : ''}>${s}</button>
          `).join('')}
        </div>

        <div class="dm-payout-box">
          <div class="dm-payout-row"><span>رهانك</span><span class="gold">${selectedStake} نقطة</span></div>
          <div class="dm-payout-row"><span>إذا فزت تأخذ</span><span class="green">${Math.round(selectedStake * DM_WIN_MULT)} نقطة</span></div>
          <div class="dm-payout-row"><span>عمولة المنصة</span><span>${Math.round(selectedStake * 2 - selectedStake * DM_WIN_MULT)} نقطة</span></div>
          <div class="dm-payout-row"><span>إذا خسرت تخسر</span><span class="red">${selectedStake} نقطة</span></div>
        </div>

        <button class="btn" id="dm-start-btn" ${user.points < selectedStake ? 'disabled' : ''}>ابدأ اللعبة</button>
        ${user.points < selectedStake ? '<div class="dm-warn">رصيدك غير كافٍ لهذا الرهان</div>' : ''}
      </div>
    `;

    document.getElementById('dm-setup-back').addEventListener('click', () => Router.navigate('home'));
    document.querySelectorAll('.dm-stake-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        selectedStake = Number(btn.dataset.stake);
        renderSetup();
      });
    });
    document.getElementById('dm-start-btn').addEventListener('click', () => {
      if (user.points < selectedStake) return;
      user.points -= selectedStake;
      Store.set('user', user);
      startRound(selectedStake);
    });
  }

  // ---------------- إدارة الجولة ----------------

  function startRound(stake) {
    const full = dmShuffle(dmBuildSet());
    st = {
      stake,
      chain: [],
      leftEnd: null,
      rightEnd: null,
      hands: [full.splice(0, DM_HAND_SIZE), full.splice(0, DM_HAND_SIZE)],
      boneyard: full,
      passesInRow: 0,
      turn: 0,
      over: false,
      outcome: null
    };
    logEntries = [];

    let starter = 0, best = -1;
    st.hands.forEach((hand, p) => {
      hand.forEach(t => {
        const score = (t.a === t.b ? 1000 : 0) + t.a + t.b;
        if (score > best) { best = score; starter = p; }
      });
    });
    st.turn = starter;
    addLog(`يبدأ ${DM_NAMES[starter]} اللعب`);
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
    if (st.passesInRow >= 2) {
      endRound({ type: 'blocked' });
      return;
    }
    advanceTurn();
  }

  function advanceTurn() {
    st.turn = (st.turn + 1) % 2;
    render();
    if (st.turn !== 0 && !st.over) {
      setTimeout(runAITurn, 750);
    }
  }

  function handPipTotal(hand) {
    return hand.reduce((sum, t) => sum + t.a + t.b, 0);
  }

  function endRound(result) {
    st.over = true;
    let winner;
    if (result.type === 'domino') {
      winner = result.winner;
      addLog(`دومينو! ${DM_NAMES[winner]} أنهى قطعه وفاز بالجولة`);
    } else {
      const totals = st.hands.map(handPipTotal);
      if (totals[0] === totals[1]) {
        winner = -1; // تعادل
        addLog('الطاولة مقفلة — تعادل بالنقاط، استرجاع الرهان');
      } else {
        winner = totals.indexOf(Math.min(...totals));
        addLog(`الطاولة مقفلة — ${DM_NAMES[winner]} يفوز بأقل مجموع نقاط`);
      }
    }

    if (winner === -1) {
      user.points += st.stake;
      st.outcome = { result: 'push' };
      addLog(`تعادل: استرجعت رهانك (${st.stake} نقطة)`);
    } else if (winner === 0) {
      const payout = Math.round(st.stake * DM_WIN_MULT);
      user.points += payout;
      st.outcome = { result: 'win', payout };
      addLog(`فزت! +${payout} نقطة إلى رصيدك`);
    } else {
      st.outcome = { result: 'lose' };
      addLog(`خسرت الرهان (${st.stake} نقطة)`);
    }
    Store.set('user', user);
    render();
  }

  // ---------------- الذكاء الاصطناعي للخصم ----------------

  function runAITurn() {
    if (st.over) return;
    const p = 1;
    const hand = st.hands[p];

    let guard = 0;
    while (!hasValidMove(hand) && st.boneyard.length > 0 && guard < 30) {
      drawTile(p);
      guard++;
    }

    if (!hasValidMove(hand)) {
      passTurn(p);
      return;
    }

    let best = null, bestSides = null;
    hand.forEach(t => {
      const sides = validSides(t);
      if (sides.length === 0) return;
      const val = t.a === t.b ? 100 + t.a * 10 : t.a + t.b;
      const bestVal = best ? (best.a === best.b ? 100 + best.a * 10 : best.a + best.b) : -1;
      if (val > bestVal) { best = t; bestSides = sides; }
    });

    const side = bestSides.includes('any') ? 'any' : (bestSides.includes('right') ? 'right' : 'left');
    playTile(p, best, side);
  }

  // ---------------- الواجهة ----------------

  function addLog(text) {
    logEntries.unshift(text);
    logEntries = logEntries.slice(0, 30);
  }

  function render() {
    const yourTurn = st.turn === 0 && !st.over;

    app.innerHTML = `
      <div class="dm-page">
        <div class="dm-topbar">
          <button class="dm-icon-btn" id="dm-menu-btn">☰</button>
          <div class="dm-info-strip">
            <div class="dm-info-cell"><span class="dm-info-label">الرهان</span><span class="dm-info-val gold">${st.stake}</span></div>
            <div class="dm-info-cell"><span class="dm-info-label">اللعبة</span><span class="dm-info-val">دومينو 1v1</span></div>
            <div class="dm-info-cell"><span class="dm-info-label">رصيدك</span><span class="dm-info-val gold">${user.points}</span></div>
          </div>
          <button class="dm-icon-btn" id="dm-info-btn">ℹ️</button>
        </div>

        <div class="dm-table dm-table-1v1">
          <div class="dm-seat-top-row">
            ${dmSeatHTML(1)}
          </div>

          <div class="dm-board-wrap" id="dm-board-wrap">
            <div class="dm-board" id="dm-board">
              <div class="dm-drop-zone dm-drop-left" id="dm-drop-left"></div>
              ${st.chain.length === 0
                ? `<div class="dm-drop-zone dm-drop-center" id="dm-drop-center"></div>`
                : st.chain.map(t => `<div class="dm-tile dm-tile-board">
                      <div class="dm-half">${dmPipHTML(t.left)}</div>
                      <div class="dm-divider"></div>
                      <div class="dm-half">${dmPipHTML(t.right)}</div>
                    </div>`).join('')}
              <div class="dm-drop-zone dm-drop-right" id="dm-drop-right"></div>
            </div>
            ${st.chain.length === 0 && yourTurn ? '<div class="dm-board-hint">اسحب قطعة من يدك إلى الطاولة للبدء</div>' : ''}
          </div>
        </div>

        <div class="dm-side-panels">
          <div class="dm-panel">
            <div class="dm-panel-title">سجل اللعبة</div>
            <div class="dm-log">
              ${logEntries.slice(0, 3).map(l => `<div class="dm-log-line">${l}</div>`).join('') || '<div class="dm-log-line dim">لا يوجد سجل بعد</div>'}
            </div>
          </div>
          <div class="dm-panel dm-panel-narrow">
            <div class="dm-panel-title">المتبقي بالحطة</div>
            <div class="dm-stock">🁢 <span>${st.boneyard.length}</span></div>
          </div>
        </div>

        <div class="dm-hand-wrap">
          ${yourTurn ? '<div class="dm-hand-hint">اسحب القطعة إلى طرف الطاولة</div>' : ''}
          ${dmHandRowHTML()}
        </div>

        <div class="dm-controls-row dm-controls-row-2">
          <button class="dm-ctrl-btn" id="dm-draw-btn" ${dmDrawEnabled() ? '' : 'disabled'}>🁢 سحب</button>
          <button class="dm-ctrl-btn dm-pass-btn" id="dm-pass-btn" ${dmPassEnabled() ? '' : 'disabled'}>مرور</button>
        </div>

        ${st.over ? renderResultHTML() : ''}
      </div>
    `;

    attachEvents();
  }

  function renderResultHTML() {
    const o = st.outcome;
    let title, cls;
    if (o.result === 'win') { title = `🎉 فزت! +${o.payout} نقطة`; cls = 'win'; }
    else if (o.result === 'push') { title = '🤝 تعادل — تم استرجاع رهانك'; cls = 'push'; }
    else { title = `😔 خسرت الرهان (${st.stake} نقطة)`; cls = 'lose'; }

    return `
      <div class="dm-match-over dm-${cls}">
        <div class="dm-match-title">${title}</div>
        <div class="dm-match-scores">
          <div class="dm-match-score-row"><span>رصيدك الحالي</span><span class="gold">${user.points} نقطة</span></div>
        </div>
        <button class="btn" id="dm-again-btn">جولة جديدة</button>
        <button class="btn btn-secondary" id="dm-home-btn" style="margin-top:8px;">العودة للرئيسية</button>
      </div>`;
  }

  function dmSeatHTML(p) {
    const count = st.hands[p].length;
    const active = st.turn === p && !st.over;
    return `
      <div class="dm-seat-card dm-seat-compact ${active ? 'active-turn' : ''}">
        <div class="dm-avatar">👤</div>
        <div class="dm-seat-name">${DM_NAMES[p]}</div>
        <div class="dm-seat-count">${count} قطع</div>
      </div>
    `;
  }

  function dmHandRowHTML() {
    const hand = st.hands[0];
    const yourTurn = st.turn === 0 && !st.over;
    return `<div class="dm-hand-row">
      ${hand.map(t => {
        const sides = yourTurn ? validSides(t) : [];
        const playable = yourTurn && sides.length > 0;
        return `<div class="dm-tile dm-tile-hand ${playable ? 'playable' : 'muted'}" data-tile-id="${t.id}">
          <div class="dm-half">${dmPipHTML(t.a)}</div>
          <div class="dm-divider"></div>
          <div class="dm-half">${dmPipHTML(t.b)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function dmDrawEnabled() {
    if (st.over || st.turn !== 0) return false;
    if (hasValidMove(st.hands[0])) return false;
    return st.boneyard.length > 0;
  }

  function dmPassEnabled() {
    if (st.over || st.turn !== 0) return false;
    if (hasValidMove(st.hands[0])) return false;
    return st.boneyard.length === 0;
  }

  function attachEvents() {
    const backBtn = document.getElementById('dm-menu-btn');
    if (backBtn) backBtn.addEventListener('click', () => {
      if (st.over || confirm('الخروج إلى الرئيسية؟ سيتم خسارة الرهان الحالي.')) Router.navigate('home');
    });
    const infoBtn = document.getElementById('dm-info-btn');
    if (infoBtn) infoBtn.addEventListener('click', () => {
      alert(`الرهان: ${st.stake} نقطة\nإذا فزت تأخذ: ${Math.round(st.stake * DM_WIN_MULT)} نقطة\nإذا خسرت تخسر: ${st.stake} نقطة`);
    });

    document.querySelectorAll('.dm-tile-hand.playable').forEach(el => {
      el.addEventListener('pointerdown', (e) => dmDragStart(e, el));
    });

    const drawBtn = document.getElementById('dm-draw-btn');
    if (drawBtn) drawBtn.addEventListener('click', () => {
      if (!dmDrawEnabled()) return;
      drawTile(0);
      render();
    });

    const passBtn = document.getElementById('dm-pass-btn');
    if (passBtn) passBtn.addEventListener('click', () => {
      if (!dmPassEnabled()) return;
      passTurn(0);
    });

    const againBtn = document.getElementById('dm-again-btn');
    if (againBtn) againBtn.addEventListener('click', () => renderSetup());
    const homeBtn = document.getElementById('dm-home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => Router.navigate('home'));

    const boardWrap = document.getElementById('dm-board-wrap');
    if (boardWrap) boardWrap.scrollLeft = boardWrap.scrollWidth / 2;
  }

  // ---------------- سحب القطعة إلى الطاولة (Drag & Drop) ----------------

  function dmDragStart(e, tileEl) {
    if (st.turn !== 0 || st.over) return;
    e.preventDefault();
    const tileId = tileEl.dataset.tileId;
    const tile = st.hands[0].find(t => t.id === tileId);
    if (!tile) return;
    const sides = validSides(tile);
    if (sides.length === 0) return;

    const rect = tileEl.getBoundingClientRect();
    const ghost = tileEl.cloneNode(true);
    ghost.classList.add('dm-tile-ghost');
    ghost.style.position = 'fixed';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.zIndex = '999';
    ghost.style.pointerEvents = 'none';
    ghost.style.willChange = 'transform';
    ghost.style.transform = 'translate3d(0,-14px,0) scale(1.12) rotate(-3deg)';
    document.body.appendChild(ghost);

    tileEl.classList.add('dm-tile-dragging-source');

    dragInfo = {
      tileId,
      sides,
      ghostEl: ghost,
      startX: e.clientX,
      startY: e.clientY,
      raf: null,
      pendingX: e.clientX,
      pendingY: e.clientY
    };

    setZoneActive('dm-drop-left', sides.includes('left'));
    setZoneActive('dm-drop-right', sides.includes('right'));
    setZoneActive('dm-drop-center', sides.includes('any'));

    document.addEventListener('pointermove', dmDragMove);
    document.addEventListener('pointerup', dmDragEnd);
  }

  function dmDragMove(e) {
    if (!dragInfo) return;
    dragInfo.pendingX = e.clientX;
    dragInfo.pendingY = e.clientY;
    if (dragInfo.raf) return;
    dragInfo.raf = requestAnimationFrame(() => dmDragPaint());
  }

  function dmDragPaint() {
    if (!dragInfo) return;
    dragInfo.raf = null;
    const dx = dragInfo.pendingX - dragInfo.startX;
    const dy = dragInfo.pendingY - dragInfo.startY;
    dragInfo.ghostEl.style.transform =
      `translate3d(${dx}px, ${dy - 14}px, 0) scale(1.12) rotate(-3deg)`;

    ['dm-drop-left', 'dm-drop-right', 'dm-drop-center'].forEach(id => {
      const el = document.getElementById(id);
      if (!el || !el.classList.contains('active')) return;
      el.classList.toggle('hover', dmPointInEl(dragInfo.pendingX, dragInfo.pendingY, el));
    });
  }

  function dmDragEnd(e) {
    document.removeEventListener('pointermove', dmDragMove);
    document.removeEventListener('pointerup', dmDragEnd);
    if (!dragInfo) return;
    if (dragInfo.raf) cancelAnimationFrame(dragInfo.raf);

    let placedSide = null;
    ['left', 'right', 'center'].forEach(key => {
      const id = key === 'center' ? 'dm-drop-center' : `dm-drop-${key}`;
      const el = document.getElementById(id);
      if (!el || !el.classList.contains('active')) return;
      if (dmPointInEl(e.clientX, e.clientY, el)) {
        placedSide = key === 'center' ? 'any' : key;
      }
    });

    dragInfo.ghostEl.remove();
    ['dm-drop-left', 'dm-drop-right', 'dm-drop-center'].forEach(id => setZoneActive(id, false));

    const tileId = dragInfo.tileId;
    dragInfo = null;

    if (placedSide) {
      const tile = st.hands[0].find(t => t.id === tileId);
      if (tile) { playTile(0, tile, placedSide); return; }
    }
    render();
  }

  function dmPointInEl(x, y, el) {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function setZoneActive(id, active) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', !!active);
    if (!active) el.classList.remove('hover');
  }
});
