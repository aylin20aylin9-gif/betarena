Router.register('notifications', (app) => {
  app.innerHTML = `
    <h2>الإشعارات</h2>
    <p style="color:#999; text-align:center; margin-top:20px;">لا توجد إشعارات جديدة</p>
    <button class="btn btn-secondary" style="margin-top:20px;" id="back-btn">رجوع</button>
  `;
  document.getElementById('back-btn').addEventListener('click', () => Router.navigate('profile'));
});
