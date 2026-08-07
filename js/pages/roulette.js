// لعبة الروليت الداخلية — تعتمد على نقاط داخل التطبيق (Game Points) وليست أموالاً حقيقية
// نسبة المنصة: 10% من مجموع الرهان في كل جولة

const RAKE_PERCENT = 0.10;
const STAKE_OPTIONS = [10, 30, 50, 100, 250, 350, 500];

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

      <div id="stake-error" class="field-error hidden">رصيدك غير كافٍ لهذا الرهان</div>

      <button class="btn" id="start-btn" style="margin-top:20px;">ابدأ الجولة</button>

      <p class="rake-note">نسبة المنصة 10% من مجموع الرهان في كل جولة</p>
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

  function startRound(mode, stake) {
    // خصم الرهان فورًا عند بدء الجولة
    user.points -= stake;
    Store.set('user', user);

    app.innerHTML = `
      <div class="center">
        <div class="roulette-wheel spinning">🎡</div>
        <h2>جاري إجراء الجولة...</h2>
        <p style="color:#999;">${mode === '1v1' ? '1 ضد 1' : '2 ضد 2'} — رهان ${stake} نقطة</p>
      </div>
    `;

    setTimeout(() => resolveRound(mode, stake), 1800);
  }

  function resolveRound(mode, stake) {
    const totalPlayers = mode === '1v1' ? 2 : 4;
    const pot = stake * totalPlayers;
    const rake = Math.round(pot * RAKE_PERCENT);
    const netPot = pot - rake;
    const winnersCount = totalPlayers / 2;
    const perWinner = Math.round(netPot / winnersCount);

    const userWins = Math.random() < 0.5;

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
  
