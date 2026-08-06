Router.register('support', (app) => {
  app.innerHTML = `
    <h2>الدعم الفني</h2>
    <div class="card">
      <p>لأي استفسار تواصل معنا عبر البريد الإلكتروني:</p>
      <p style="color:#ffd166; margin-top:8px;">support@betarena.app</p>
    </div>
    <button class="btn btn-secondary" style="margin-top:20px;" id="back-btn">رجوع</button>
  `;
  document.getElementById('back-btn').addEventListener('click', () => Router.navigate('profile'));
});
