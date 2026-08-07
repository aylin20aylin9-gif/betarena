Router.register('login', (app) => {
  app.innerHTML = `
    <div class="center">
      <div class="logo">BetArena</div>
      <p style="color:#999; margin-top:-8px;">سجّل دخولك أو أنشئ حساب جديد</p>

      <div style="width:100%; margin-top:10px;">
        <label class="field-label">رقم الهاتف</label>
        <input type="tel" id="phone-input" class="input" placeholder="07xxxxxxxxx" inputmode="tel" />

        <div id="phone-error" class="field-error hidden">الرجاء إدخال رقم هاتف صحيح</div>

        <button class="btn" id="send-otp-btn">متابعة</button>

        <p class="terms-note">
          بالمتابعة، أنت توافق على
          <a href="#" id="terms-link">الشروط والأحكام</a>
        </p>
      </div>
    </div>
  `;

  const phoneInput = document.getElementById('phone-input');
  const errorMsg = document.getElementById('phone-error');

  document.getElementById('send-otp-btn').addEventListener('click', () => {
    const phone = phoneInput.value.trim();
    const isValid = /^07[0-9]{9}$/.test(phone);

    if (!isValid) {
      errorMsg.classList.remove('hidden');
      phoneInput.classList.add('input-error');
      return;
    }

    errorMsg.classList.add('hidden');
    phoneInput.classList.remove('input-error');

    Store.set('pending_phone', phone);
    Router.navigate('verify-otp');
  });

  document.getElementById('terms-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('صفحة الشروط والأحكام — قيد الإعداد');
  });
});
