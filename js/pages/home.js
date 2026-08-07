Router.register('home', (app) => {
  const user = Store.get('user', { name: 'مستخدم', points: 0 });
  if (typeof user.points !== 'number') {
    user.points = 500; // رصيد نقاط ترحيبي للمستخدمين الجدد
    Store.set('user', user);
  }
  const rooms = Store.get('rooms', []);

  app.innerHTML = `
    <h2>مرحبًا، ${user.name}</h2>

    <div class="play-card" id="play-card">
      <div>
        <div class="play-card-title">🁣 دومينو BetArena</div>
        <div class="play-card-sub">رصيدك: ${user.points} نقطة</div>
      </div>
      <button class="btn play-btn" id="play-btn">العب</button>
    </div>

    <div class="card">
      <p>الغرف المتاحة</p>
    </div>
    <div id="rooms-list"></div>
  `;

  document.getElementById('play-btn').addEventListener('click', () => {
    Router.navigate('domino');
  });

  const list = document.getElementById('rooms-list');
  if (rooms.length === 0) {
    list.innerHTML = `<p style="color:#999; text-align:center; margin-top:20px;">لا توجد غرف حاليًا. أنشئ غرفة جديدة!</p>`;
  } else {
    rooms.forEach((room) => {
      const div = document.createElement('div');
      div.className = 'room-item';
      div.innerHTML = `
        <span>${room.name}</span>
        <span style="color:#ffd166;">${room.amount} د.ع</span>
      `;
      list.appendChild(div);
    });
  }
});
