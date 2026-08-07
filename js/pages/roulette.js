// لعبة الروليت الداخلية — تعتمد على نقاط داخل التطبيق (Game Points) وليست أموالاً حقيقية
// نسبة المنصة: 10% من مجموع الرهان في كل جولة
// عجلة حقيقية (8 قطاعات: 4 فوز / 4 خسارة) تدور وتتوقف على النتيجة

const RAKE_PERCENT = 0.10;
const STAKE_OPTIONS = [10, 30, 50, 100, 250, 350, 500];
const WHEEL_SEGMENTS = 8; // 4 قطاعات فوز + 4 قطاعات خسارة بالتناوب
const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS;

Router.register('roulette', (app) => {
  const user = Store.get('user', { name: 'مستخدم', points: 0 });
  if (typeof user.points !== 'number') user.points = 0;

  let selectedMode = '1v1'; // '1v1' أو '2v2'
  let selectedStake = null;

  renderSelectScreen();

  function renderSelectScreen() {
    app.innerHTML = `
      <h2>🎯 روليت BetArena</h2>

      <div class="points-badge">
        رصيدك: <span class="points-value">${user.points}</span> نقطة
      </div>

      <p class="field-label" style="margin-top:20px;">نوع الرهان</p>
      <div class="mode-grid">
        <button class="mode-card ${selectedMode === '1v1' ? 'active' : ''}" data-mode="1v1">
          <div class="mode-title">1 ضد 1</div>
          <div class="mode-sub">لاعب واحد ضد لاعب واحد</div>
        </button>
        <button class="mode-card ${selectedMode === '2v2' ? 'active' : ''}" data-mode="2v2">
          <div class="mode-title">2 ضد 2</div>
          <div class="mode-sub">فريق من لاعبين ضد فريق</div>
        </button>
      </div>

      <p class="field-label" style="margin-top:20px;">مبلغ الرهان (نقطة)</p>
      <div class="stake-grid">
        ${STAKE_OPTIONS.map(s => `
          <button class="stake-chip ${selectedStake === s ? 'active' : ''}" data-stake="${s}">
            ${s}
          </button>
        `).join('')}
      </div>

      <div id="round-preview" class="round-preview hidden"></div>

      <div id="stake-error" class="field-error hidden">اختر مبلغ الرهان أولاً</div>

      <button class="btn" id="start-btn" style="margin-top:20px;">ابدأ الجولة</button>

      <p class="rake-note">نسبة المنصة 10% من مجموع الرهان — احتمالية الفوز 50%</p>
    `;

    document.querySelectorAll('.mode-card').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMode = btn.dataset.mode;
        renderSelectScreen();
      });
    });

    document.querySelectorAll('.stake-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedStake = Number(btn.dataset.stake);
        renderSelectScreen();
      });
    });

    updatePreview();

    document.getElementById('start-btn').addEventListener('click', () => {
      const stakeError = document.getElementById('stake-error');
      stakeError.classList.add('hidden');

      if (!selectedStake) {
        stakeError.textContent = 'اختر مبلغ الرهان أولاً';
        stakeError.classList.remove('hidden');
        return;
      }

      if (user.points < selectedStake) {
        stakeError.textContent = 'رصيدك غير كافٍ لهذا الرهان';
        stakeError.classList.remove('hidden');
        return;
      }

      startRound(selectedMode, selectedStake);
    });
  }

  function updatePreview() {
    const preview = document.getElementById('round-preview');
    if (!selectedStake) {
      preview.classList.add('hidden');
      return;
    }
    const totalPlayers = selectedMode === '1v1' ? 2 : 4;
    const pot = selectedStake * totalPlayers;
    const rake = Math.round(pot * RAKE_PERCENT);
    const netPot = pot - rake;
    const winnersCount = totalPlayers / 2;
    const perWinner = Math.round(netPot / winnersCount);

    preview.classList.remove('hidden');
    preview.innerHTML = `
      <div class="preview-row"><span>مجموع الرهان</span><span>${pot} نقطة</span></div>
      <div class="preview-row"><span>عمولة المنصة (10%)</span><span>-${rake} نقطة</span></div>
      <div class="preview-row preview-highlight"><span>نصيب كل فائز</span><span>${perWinner} نقطة</span></div>
    `;
  }

  function buildWheelGradient() {
    // 8 قطاعات بالتناوب: ذهبي (فوز) / غامق (خسارة)
    const stops = [];
    for (let i = 0; i < WHEEL_SEGMENTS; i++) {
      const color = i % 2 === 0 ? '#ffd166' : '#2a2a2a';
      const start = i * SEGMENT_ANGLE;
      const end = start + SEGMENT_ANGLE;
      stops.push(`${color} ${start}deg ${end}deg`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  }

  function startRound(mode, stake) {
    // خصم الرهان فورًا عند بدء الجولة
    user.points -= stake;
    Store.set('user', user);

    // تحديد النتيجة مسبقًا (50/50) لتحريك العجلة نحو القطاع الصحيح
    const userWins = Math.random() < 0.5;

    // اختيار قطاع عشوائي يطابق النتيجة (زوجي = فوز، فردي = خسارة)
    const matchingSegments = [];
    for (let i = 0; i < WHEEL_SEGMENTS; i++) {
      const isWinSegment = i % 2 === 0;
      if (isWinSegment === userWins) matchingSegments.push(i);
    }
    const targetSegment = matchingSegments[Math.floor(Math.random() * matchingSegments.length)];
    const segmentCenter = targetSegment * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

    // دورات كاملة إضافية لإحساس واقعي بالدوران + زاوية التوقف على القطاع المطلوب
    const extraSpins = 5 * 360;
    const finalRotation = extraSpins + (360 - segmentCenter);

    app.innerHTML = `
      <div class="center">
        <div class="wheel-wrap">
          <div class="wheel-pointer">▼</div>
          <div class="wheel" id="wheel" style="background:${buildWheelGradient()}"></div>
          <div class="wheel-hub"></div>
        </div>
        <h2 style="margin-top:20px;">جاري إجراء الجولة...</h2>
        <p style="color:#999;">${mode === '1v1' ? '1 ضد 1' : '2 ضد 2'} — رهان ${stake} نقطة</p>
      </div>
    `;

    const wheel = document.getElementById('wheel');
    // إجبار المتصفح على تطبيق الحالة الابتدائية قبل بدء التحريك
    requestAnimationFrame(() => {
      wheel.style.transition = 'transform 3.2s cubic-bezier(0.17, 0.67, 0.32, 1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });

    setTimeout(() => resolveRound(mode, stake, userWins), 3400);
  }

  function resolveRound(mode, stake, userWins) {
    const totalPlayers = mode === '1v1' ? 2 : 4;
    const pot = stake * totalPlayers;
    const rake = Math.round(pot * RAKE_PERCENT);
    const netPot = pot - rake;
    const winnersCount = totalPlayers / 2;
    const perWinner = Math.round(netPot / winnersCount);

    if (userWins) {
      user.points += perWinner;
    }
    Store.set('user', user);

    // تسجيل الجولة بسجل بسيط
    const history = Store.get('game_history', []);
    history.unshift({
      mode,
      stake,
      result: userWins ? 'win' : 'lose',
      amount: userWins ? perWinner : stake,
      date: new Date().toISOString()
    });
    Store.set('game_history', history.slice(0, 30));

    app.innerHTML = `
      <div class="center">
        <div class="result-icon">${userWins ? '🏆' : '💔'}</div>
        <h2 class="${userWins ? 'result-win' : 'result-lose'}">
          ${userWins ? 'فزت بالجولة!' : 'خسرت الجولة'}
        </h2>
        <p class="result-amount ${userWins ? 'result-win' : 'result-lose'}">
          ${userWins ? '+' + perWinner : '-' + stake} نقطة
        </p>
        <p style="color:#999;">رصيدك الحالي: ${user.points} نقطة</p>

        <div style="width:100%; margin-top:20px;">
          <button class="btn" id="play-again-btn">جولة جديدة</button>
          <button class="btn-secondary btn" id="back-home-btn" style="margin-top:10px;">الرجوع للرئيسية</button>
        </div>
      </div>
    `;

    document.getElementById('play-again-btn').addEventListener('click', () => {
      selectedStake = null;
      renderSelectScreen();
    });
    document.getElementById('back-home-btn').addEventListener('click', () => {
      Router.navigate('home');
    });
  }
});
