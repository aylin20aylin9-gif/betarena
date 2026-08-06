Router.register('settings', (app) => {
  app.innerHTML = `
    <h2>الإعدادات</h2>
    <div class="list-item">اللغة <span>العربية</span></div>
    <div class="list-item">الإشعارات <span>مفعّلة</span></div>
    <button class="btn btn-secondary" style="margin-top:20px;" id="back-btn">رجوع</button>
  `;
  document.getElementById('back-btn').addEventListener('click', () => Router.navigate('profile'));
});
