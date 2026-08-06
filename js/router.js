// راوتر بسيط يعتمد على hash (#) — يشتغل مباشرة بدون سيرفر أو أدوات بناء
const Router = {
  routes: {},

  register(path, renderFn) {
    this.routes[path] = renderFn;
  },

  navigate(path) {
    window.location.hash = `#/${path}`;
  },

  resolve() {
    const hash = window.location.hash.replace('#/', '') || 'splash';
    const path = hash.split('?')[0];
    const app = document.getElementById('app');
    const bottomNav = document.getElementById('bottom-nav');

    const renderFn = this.routes[path];

    if (!renderFn) {
      app.innerHTML = `<div class="center"><h2>الصفحة غير موجودة</h2></div>`;
      return;
    }

    // إظهار/إخفاء الشريط السفلي حسب الصفحة
    const pagesWithNav = ['home', 'create-room', 'wallet', 'profile'];
    if (pagesWithNav.includes(path)) {
      bottomNav.classList.remove('hidden');
      document.querySelectorAll('#bottom-nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.route === path);
      });
    } else {
      bottomNav.classList.add('hidden');
    }

    app.innerHTML = '';
    renderFn(app);
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  }
};
