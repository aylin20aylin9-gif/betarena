Router.register('wallet', (app) => {
  const user = Store.get('user', { wallet: 0 });

  app.innerHTML = `
    <h2>المحفظة</h2>
    <div class="wallet-balance">${user.wallet || 0} د.ع</div>
    <button class="btn" id="deposit-btn">إيداع رصيد</button>
    <button class="btn btn-secondary" style="margin-top:10px;" id="withdraw-btn">سحب رصيد</button>
  `;

  document.getElementById('deposit-btn').addEventListener('click', () => {
    const amount = prompt('أدخل المبلغ المراد إيداعه:');
    if (amount && !isNaN(amount)) {
      user.wallet = (user.wallet || 0) + Number(amount);
      Store.set('user', user);
      Router.resolve();
    }
  });

  document.getElementById('withdraw-btn').addEventListener('click', () => {
    alert('طلب السحب قيد التطوير');
  });
});
