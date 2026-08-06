Router.register('verify-otp', (app) => {
  const phone = Store.get('pending_phone', '');

  app.innerHTML = `
    <div class="center">
      <h2>رمز التحقق</h2>
      <p style="color:#999; margin-bottom:20px;">تم إرسال الرمز إلى ${phone}</p>
      <div class="otp-inputs">
        <input type="text" maxlength="1" class="otp-digit" />
        <input type="text" maxlength="1" class="otp-digit" />
        <input type="text" maxlength="1" class="otp-digit" />
        <input type="text" maxlength="1" class="otp-digit" />
      </div>
      <button class="btn" id="verify-btn">تأكيد</button>
    </div>
  `;

  const digits = document.querySelectorAll('.otp-digit');
  digits.forEach((input, idx) => {
    input.addEventListener('input', () => {
      if (input.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
    });
  });

  document.getElementById('verify-btn').addEventListener('click', () => {
    Store.set('user', { phone, name: 'مستخدم جديد', wallet: 0 });
    Store.remove('pending_phone');
    Router.navigate('home');
  });
});
