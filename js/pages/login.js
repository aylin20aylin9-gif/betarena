Router.register('login', (app) => {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="center" style="min-height:auto; padding-top:40px; padding-bottom:20px;">
        <div class="logo">BetArena</div>
      </div>

      <div class="tabs">
        <button class="tab-btn active" id="tab-login">تسجيل الدخول</button>
        <button class="tab-btn" id="tab-signup">حساب جديد</button>
      </div>

      <!-- نموذج تسجيل الدخول -->
      <form id="login-form" class="auth-form">
        <label class="field-label">رقم الهاتف</label>
        <input type="tel" id="login-phone" class="input" placeholder="07xxxxxxxxx" inputmode="tel" />
        <div id="login-phone-error" class="field-error hidden">أدخل رقم هاتف صحيح</div>

        <label class="field-label">كلمة المرور</label>
        <input type="password" id="login-password" class="input" placeholder="••••••••" />
        <div id="login-password-error" class="field-error hidden">أدخل كلمة المرور</div>

        <div id="login-general-error" class="field-error hidden">رقم الهاتف أو كلمة المرور غير صحيحة</div>

        <button type="submit" class="btn">تسجيل الدخول</button>
      </form>

      <!-- نموذج إنشاء حساب جديد -->
      <form id="signup-form" class="auth-form hidden">
        <label class="field-label">الاسم الكامل</label>
        <input type="text" id="signup-name" class="input" placeholder="مثال: أحمد علي" />
        <div id="signup-name-error" class="field-error hidden">أدخل اسمك الكامل</div>

        <label class="field-label">رقم الهاتف</label>
        <input type="tel" id="signup-phone" class="input" placeholder="07xxxxxxxxx" inputmode="tel" />
        <div id="signup-phone-error" class="field-error hidden">أدخل رقم هاتف صحيح</div>

        <label class="field-label">كلمة المرور</label>
        <input type="password" id="signup-password" class="input" placeholder="٦ أحرف على الأقل" />
        <div id="signup-password-error" class="field-error hidden">كلمة المرور يجب أن تكون ٦ أحرف على الأقل</div>

        <label class="field-label">إعادة كلمة المرور</label>
        <input type="password" id="signup-password-confirm" class="input" placeholder="••••••••" />
        <div id="signup-password-confirm-error" class="field-error hidden">كلمتا المرور غير متطابقتين</div>

        <label class="field-label">كود الدعوة <span class="optional-tag">(اختياري)</span></label>
        <input type="text" id="signup-referral" class="input" placeholder="اكتب الكود إن وجد" />

        <div id="signup-general-error" class="field-error hidden">رقم الهاتف مسجّل مسبقًا</div>

        <button type="submit" class="btn">إنشاء الحساب</button>
      </form>

      <p class="terms-note">
        بالمتابعة، أنت توافق على
        <a href="#" id="terms-link">الشروط والأحكام</a>
      </p>
    </div>
  `;

  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  });

  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  const phoneRegex = /^07[0-9]{9}$/;

  // ---- تسجيل الدخول ----
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;

    const phoneError = document.getElementById('login-phone-error');
    const passwordError = document.getElementById('login-password-error');
    const generalError = document.getElementById('login-general-error');

    let valid = true;
    phoneError.classList.add('hidden');
    passwordError.classList.add('hidden');
    generalError.classList.add('hidden');

    if (!phoneRegex.test(phone)) {
      phoneError.classList.remove('hidden');
      valid = false;
    }
    if (!password) {
      passwordError.classList.remove('hidden');
      valid = false;
    }
    if (!valid) return;

    const registeredUsers = Store.get('registered_users', {});
    const existing = registeredUsers[phone];

    if (!existing || existing.password !== password) {
      generalError.classList.remove('hidden');
      return;
    }

    Store.set('user', existing);
    Router.navigate('home');
  });

  // ---- إنشاء حساب جديد ----
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;
    const referral = document.getElementById('signup-referral').value.trim();

    const nameError = document.getElementById('signup-name-error');
    const phoneError = document.getElementById('signup-phone-error');
    const passwordError = document.getElementById('signup-password-error');
    const confirmError = document.getElementById('signup-password-confirm-error');
    const generalError = document.getElementById('signup-general-error');

    [nameError, phoneError, passwordError, confirmError, generalError].forEach(el => el.classList.add('hidden'));

    let valid = true;

    if (!name) {
      nameError.classList.remove('hidden');
      valid = false;
    }
    if (!phoneRegex.test(phone)) {
      phoneError.classList.remove('hidden');
      valid = false;
    }
    if (!password || password.length < 6) {
      passwordError.classList.remove('hidden');
      valid = false;
    }
    if (password !== passwordConfirm) {
      confirmError.classList.remove('hidden');
      valid = false;
    }
    if (!valid) return;

    const registeredUsers = Store.get('registered_users', {});

    if (registeredUsers[phone]) {
      generalError.classList.remove('hidden');
      return;
    }

    const newUser = {
      name,
      phone,
      password, // ملاحظة: تخزين مؤقت محلي فقط، يجب تشفير كلمة المرور عند ربط الباك اند الحقيقي
      wallet: 0,
      points: 500, // رصيد نقاط ترحيبي للعب داخل التطبيق
      referredBy: referral || null
    };

    registeredUsers[phone] = newUser;
    Store.set('registered_users', registeredUsers);
    Store.set('user', newUser);

    Router.navigate('home');
  });

  document.getElementById('terms-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('صفحة الشروط والأحكام — قيد الإعداد');
  });
});
