Router.register('verify-otp', (app) => {
  const phone = Store.get('pending_phone', '');

  app.innerHTML = `
    <div class="center">
      <h2>رمز التحقق</h2>
      <p style="color:#999; margin-bottom:20px;">تم إرسال الرمز إلى ${phone}</p>
      <div class="otp-inputs">
        <input type="text" maxlength="1" inputmode="numeric" class="otp-digit" />
        <input type="text" maxlength="1" inputmode="numeric" class="otp-digit" />
        <input type="text" maxlength="1" inputmode="numeric" class="otp-digit" />
        <input type="text" maxlength="1" inputmode="numeric" class="otp-digit" />
      </div>
      <div id="otp-error" class="field-error hidden">الرمز غير صحيح، حاول مرة أخرى</div>
      <button class="btn" id="verify-btn">تأكيد</button>
      <button class="btn-link" id="resend-btn">إعادة إرسال الرمز</button>
    </div>
  `;

  const digits = document.querySelectorAll('.otp-digit');
  digits[0].focus();

  digits.forEach((input, idx) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        digits[idx - 1].focus();
      }
    });
  });

  document.getElementById('verify-btn').addEventListener('click', () => {
    const code = Array.from(digits).map(d => d.value).join('');
    const errorMsg = document.getElementById('otp-error');

    if (code.length !== 4) {
      errorMsg.classList.remove('hidden');
      return;
    }
    errorMsg.classList.add('hidden');

    // التحقق هل الرقم مسجّل مسبقًا (سجل محلي مؤقت لحين ربط الباك اند)
    const registeredUsers = Store.get('registered_users', {});
    const existing = registeredUsers[phone];

    Store.remove('pending_phone');

    if (existing) {
      Store.set('user', existing);
      Router.navigate('home');
    } else {
      Store.set('user_phone_verified', phone);
      Router.navigate('complete-profile');
    }
  });

  document.getElementById('resend-btn').addEventListener('click', () => {
    alert('تم إرسال رمز جديد إلى ' + phone);
  });
});
