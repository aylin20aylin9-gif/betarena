// إدارة الحالة البسيطة عبر localStorage (بديل مؤقت لحين ربط الباك اند)
const Store = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  isLoggedIn() {
    return !!this.get('user');
  }
};
