Router.register('create-room', (app) => {
  app.innerHTML = `
    <h2>إنشاء غرفة جديدة</h2>
    <input type="text" id="room-name" class="input" placeholder="اسم الغرفة" />
    <input type="number" id="room-amount" class="input" placeholder="مبلغ الاشتراك (د.ع)" />
    <button class="btn" id="create-btn">إنشاء الغرفة</button>
  `;

  document.getElementById('create-btn').addEventListener('click', () => {
    const name = document.getElementById('room-name').value.trim();
    const amount = document.getElementById('room-amount').value.trim();

    if (!name || !amount) {
      alert('الرجاء تعبئة جميع الحقول');
      return;
    }

    const rooms = Store.get('rooms', []);
    rooms.push({ name, amount, id: Date.now() });
    Store.set('rooms', rooms);

    Router.navigate('waiting-room');
  });
});
