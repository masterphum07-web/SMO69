/**
 * Configuration & Storage Manager for SMO69 Attendance System
 */
const CONFIG_KEYS = {
  API_URL: 'smo69_api_url',
  AUTH_USER: 'smo69_auth_user',
  USE_MOCK: 'smo69_use_mock_data',
  CURRENT_SESSION: 'smo69_current_session_id',
  POLL_INTERVAL: 'smo69_poll_interval'
};

const DEFAULT_CONFIG = {
  // ค่าเริ่มต้น หากยังไม่ได้ใส่ URL สามารถทดสอบผ่านระบบ Mock ได้ทันที
  apiUrl: localStorage.getItem(CONFIG_KEYS.API_URL) || '',
  useMock: localStorage.getItem(CONFIG_KEYS.USE_MOCK) !== 'false', // ค่าเริ่มต้นเป็น true จนกว่าจะตั้ง URL จริง
  pollInterval: parseInt(localStorage.getItem(CONFIG_KEYS.POLL_INTERVAL), 10) || 8000 // 8 วินาทีตามสเปก 5-10 วิ
};

const Config = {
  getApiUrl() {
    return localStorage.getItem(CONFIG_KEYS.API_URL) || '';
  },

  setApiUrl(url) {
    localStorage.setItem(CONFIG_KEYS.API_URL, url.trim());
    if (url.trim()) {
      localStorage.setItem(CONFIG_KEYS.USE_MOCK, 'false');
    }
  },

  isMockMode() {
    const url = this.getApiUrl();
    if (!url) return true;
    return localStorage.getItem(CONFIG_KEYS.USE_MOCK) === 'true';
  },

  setMockMode(val) {
    localStorage.setItem(CONFIG_KEYS.USE_MOCK, val ? 'true' : 'false');
  },

  getPollInterval() {
    return DEFAULT_CONFIG.pollInterval;
  },

  setPollInterval(seconds) {
    const ms = Math.max(5000, Math.min(30000, seconds * 1000));
    localStorage.setItem(CONFIG_KEYS.POLL_INTERVAL, ms);
  }
};
