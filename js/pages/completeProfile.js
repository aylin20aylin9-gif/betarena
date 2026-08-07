Router.register('complete-profile', (app) => {
  const phone = Store.get('user_phone_verified', '') || '';

  app.innerHTML = `
    <div class="center">
      <div class="logo">BetArena</div>
      <h2>أكمل بيانات حسابك</h2>

      <div style="width:100%;">
        <label class="field-label">الاسم الكامل</label>
        <input type="text" id="name-input" class="input" placeholder="مثال: أحمد علي" />
        <div id="name-error" class="field-error hidden">الرجاء إدخال اسمك</div>

        <button class="btn" id="finish-btn">إنشاء الحساب</button>
      </div>
    </div>
  `;

  document.getElementById('finish-btn').addEventListener('click', () => {
    const name = document.getElementById('name-input').value.trim();
    const errorMsg = document.getElementById('name-error');

    if (!name) {
      errorMsg.classList.remove('hidden');
      return;
    }
    errorMsg.classList.add('hidden');

    const newUser = { phone, name, wallet: 0 };

    const registeredUsers = Store.get('registered_users', {});
    registeredUsers[phone] = newUser;
    Store.set('registered_users', registeredUsers);

    Store.set('user', newUser);
    Store.remove('user_phone_verified');

    Router.navigate('home');
  });
});
