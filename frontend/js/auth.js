/**
 * Authentication & Session Management
 * จัดการ Session ของ Checker และ Admin ผ่าน localStorage
 */

const Auth = {
  getUser() {
    const raw = localStorage.getItem(CONFIG_KEYS.AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return this.getUser() !== null;
  },

  isAdmin() {
    const user = this.getUser();
    return user && (user.role === 'admin' || user.role === 'super_admin');
  },

  isChecker() {
    const user = this.getUser();
    return user && (user.role === 'checker' || user.role === 'admin');
  },

  async login(adminId, pin) {
    const res = await Api.requestPost('login', { adminId, pin });
    if (res && res.success && res.user) {
      localStorage.setItem(CONFIG_KEYS.AUTH_USER, JSON.stringify(res.user));
      return { success: true, user: res.user };
    }
    return { success: false, error: (res && res.error) ? res.error : 'เข้าสู่ระบบไม่สำเร็จ' };
  },

  logout() {
    localStorage.removeItem(CONFIG_KEYS.AUTH_USER);
    window.location.reload();
  }
};

window.Auth = Auth;
