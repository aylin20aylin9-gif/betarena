Router.register('splash', (app) => {
  app.innerHTML = `
    <div class="center">
      <div class="logo">BetArena</div>
      <div class="loader"></div>
    </div>
  `;

  setTimeout(() => {
    if (Store.isLoggedIn()) {
      Router.navigate('home');
    } else {
      Router.navigate('login');
    }
  }, 1200);
});
