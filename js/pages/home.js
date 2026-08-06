Router.register('home', (app) => {
  const user = Store.get('user', { name: 'مستخدم' });
  const rooms = Store.get('rooms', []);

  app.innerHTML = `
    <h2>مرحبًا، ${user.name}</h2>
    <div class="card">
      <p>الغرف المتاحة</p>
    </div>
    <div id="rooms-list"></div>
  `;

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
