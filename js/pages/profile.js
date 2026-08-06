Router.register('profile', (app) => {
  const user = Store.get('user', { name: 'مستخدم', phone: '' });

  app.innerHTML = `
    <h2>حسابي</h2>
    <div class="card">
      <p><strong>الاسم:</strong> ${user.name}</p>
      <p><strong>الهاتف:</strong> ${user.phone}</p>
    </div>
    <div class="list-item" id="notif-link" style="cursor:pointer;">الإشعارات <span>›</span></div>
    <div class="list-item" id="settings-link" style="cursor:pointer;">الإعدادات <span>›</span></div>
    <div class="list-item" id="support-link" style="cursor:pointer;">الدعم الفني <span>›</span></div>
    <button class="btn btn-secondary" style="margin-top:20px;" id="logout-btn">تسجيل الخروج</button>
  `;

  document.getElementById('notif-link').addEventListener('click', () => Router.navigate('notifications'));
  document.getElementById('settings-link').addEventListener('click', () => Router.navigate('settings'));
  document.getElementById('support-link').addEventListener('click', () => Router.navigate('support'));
  document.getElementById('logout-btn').addEventListener('click', () => {
    Store.remove('user');
    Router.navigate('login');
  });
});
