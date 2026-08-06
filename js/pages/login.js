Router.register('login', (app) => {
  app.innerHTML = `
    <div class="center">
      <div class="logo">BetArena</div>
      <h2>تسجيل الدخول</h2>
      <div style="width:100%">
        <input type="tel" id="phone-input" class="input" placeholder="رقم الهاتف" />
        <button class="btn" id="send-otp-btn">إرسال رمز التحقق</button>
      </div>
    </div>
  `;

  document.getElementById('send-otp-btn').addEventListener('click', () => {
    const phone = document.getElementById('phone-input').value.trim();
    if (!phone) {
      alert('الرجاء إدخال رقم الهاتف');
      return;
    }
    Store.set('pending_phone', phone);
    Router.navigate('verify-otp');
  });
});
