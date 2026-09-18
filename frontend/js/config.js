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

// URL ที่ผู้ใช้ Deploy จาก Google Sheets
const BUILTIN_API_URL = 'https://script.google.com/macros/s/AKfycbzSUwpiZQqSBzYmmc7Wezv5qWVd5bwu3JdkGwrKYajc_ye48iOMKaOG7fwAsOU5ZKw/exec';

const DEFAULT_CONFIG = {
  apiUrl: localStorage.getItem(CONFIG_KEYS.API_URL) || BUILTIN_API_URL,
  useMock: localStorage.getItem(CONFIG_KEYS.USE_MOCK) === 'true',
  pollInterval: 25000
};

const Config = {
  getApiUrl() {
    return localStorage.getItem(CONFIG_KEYS.API_URL) || BUILTIN_API_URL;
  },

  setApiUrl(url) {
    localStorage.setItem(CONFIG_KEYS.API_URL, url.trim());
    if (url.trim()) {
      localStorage.setItem(CONFIG_KEYS.USE_MOCK, 'false');
    }
  },

  isMockMode() {
    const custom = localStorage.getItem(CONFIG_KEYS.USE_MOCK);
    if (custom !== null) {
      return custom === 'true';
    }
    // มี Built-in URL ให้เริ่มต้นที่โหมดเชื่อมต่อ Google Sheets จริง
    return false;
  },

  setMockMode(val) {
    localStorage.setItem(CONFIG_KEYS.USE_MOCK, val ? 'true' : 'false');
  },

  getPollInterval() {
    const custom = parseInt(localStorage.getItem(CONFIG_KEYS.POLL_INTERVAL), 10);
    if (custom && custom >= 15000) {
      return custom;
    }
    return 25000;
  },

  setPollInterval(seconds) {
    const ms = Math.max(15000, Math.min(60000, seconds * 1000));
    localStorage.setItem(CONFIG_KEYS.POLL_INTERVAL, ms);
  }
};

window.Config = Config;
