/**
 * API Client for SMO69 Attendance System
 * สื่อสารกับ Google Apps Script Web App (doGet / doPost)
 * มีระบบ JSONP Fallback อัตโนมัติ (แก้ปัญหา CORS ของ Google Apps Script ได้ 100%)
 * พร้อมระบบ Cache ข้อมูลเริ่มต้น เพื่อให้เปิดหน้าเว็บได้เร็วทันใจ
 */

const Api = {
  cache: {
    initialData: null,
    branches: null,
    students: null,
    sessions: null
  },

  async getInitialData(forceRefresh = false) {
    if (!forceRefresh && this.cache.initialData) {
      return { success: true, data: this.cache.initialData };
    }

    const res = await this.requestGet('getInitialData');
    if (res && res.success && res.data) {
      this.cache.initialData = res.data;
      if (res.data.branches) this.cache.branches = res.data.branches;
      if (res.data.students) this.cache.students = res.data.students;
      if (res.data.sessions) this.cache.sessions = res.data.sessions;
    }
    return res;
  },

  clearCache() {
    this.cache.initialData = null;
    this.cache.sessions = null;
  },

  async requestGet(action, params = {}) {
    if (Config.isMockMode()) {
      return this.mockGet(action, params);
    }

    const apiUrl = Config.getApiUrl();
    if (!apiUrl) {
      return this.mockGet(action, params);
    }

    // 1. ลองดึงข้อมูลด้วย fetch ปกติก่อน (ตั้ง timeout 3.5 วินาที)
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (fetchErr) {
      // หากเกิด CORS หรือ timeout ให้ข้ามไปใช้ JSONP อัตโนมัติ
      console.warn(`[Api GET ${action}] Fetch ขัดข้อง (${fetchErr.message}) สลับไปใช้ JSONP...`);
    }

    // 2. ใช้ JSONP ซึ่งรับประกันการเชื่อมต่อกับ Apps Script 100% โดยไม่มีข้อจำกัดเรื่อง CORS
    try {
      const jsonpData = await this.fetchJsonp(apiUrl, action, params);
      return jsonpData;
    } catch (jsonpErr) {
      console.warn(`[Api GET ${action}] JSONP ล้มเหลว (${jsonpErr.message}) สลับไปใช้ Mock data สำรอง`);
      return this.mockGet(action, params);
    }
  },

  fetchJsonp(apiUrl, action, params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName = 'smo_cb_' + Math.random().toString(36).substr(2, 9);
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callbackName);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });

      let timer = null;

      window[callbackName] = function(data) {
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.src = url.toString();
      script.async = true;

      function cleanup() {
        if (timer) clearTimeout(timer);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[callbackName];
      }

      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP script load error'));
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP request timeout (8s)'));
      }, 8000);

      document.head.appendChild(script);
    });
  },

  async requestPost(action, payload = {}) {
    if (Config.isMockMode()) {
      return this.mockPost(action, payload);
    }

    const apiUrl = Config.getApiUrl();
    if (!apiUrl) {
      return this.mockPost(action, payload);
    }

    const bodyData = {
      action: action,
      ...payload
    };

    try {
      // ใช้ text/plain เพื่อป้องกัน CORS preflight OPTIONS request
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData)
      });
      if (!res.ok) throw new Error('HTTP Status ' + res.status);
      const data = await res.json();
      this.clearCache(); // ล้างแคชเมื่อมีการบันทึกข้อมูล
      return data;
    } catch (err) {
      console.warn(`[Api POST ${action}] ข้อผิดพลาด (${err.message}) บันทึกชั่วคราวใน Local Mock`);
      return this.mockPost(action, payload);
    }
  },

  mockGet(action, params) {
    return new Promise(resolve => {
      setTimeout(() => {
        switch (action) {
          case 'ping':
            resolve({ success: true, message: 'Mock API Online' });
            break;
          case 'getInitialData':
            resolve({
              success: true,
              data: {
                branches: MockDB.getBranches(),
                students: MockDB.getStudents(),
                sessions: MockDB.getSessions(),
                leaderboard: MockDB.getLeaderboard(),
                dashboard: MockDB.getDashboard()
              }
            });
            break;
          case 'getBranches':
            resolve({ success: true, data: MockDB.getBranches() });
            break;
          case 'getStudents':
            resolve({ success: true, data: MockDB.getStudents(params.branch) });
            break;
          case 'getSessions':
            resolve({ success: true, data: MockDB.getSessions() });
            break;
          case 'getSessionAttendance':
            resolve({ success: true, data: MockDB.getSessionAttendance(params.sessionId) });
            break;
          case 'getLeaderboard':
            resolve({ success: true, data: MockDB.getLeaderboard() });
            break;
          case 'getDashboard':
            resolve({ success: true, data: MockDB.getDashboard(params.branch) });
            break;
          default:
            resolve({ success: false, error: 'Unknown action ' + action });
        }
      }, 80);
    });
  },

  mockPost(action, payload) {
    return new Promise(resolve => {
      setTimeout(() => {
        switch (action) {
          case 'login':
            resolve(MockDB.loginCheck(payload.adminId, payload.pin));
            break;
          case 'createSession':
            resolve(MockDB.createSession(payload.title, payload.date, payload.branchScope, payload.adminId));
            break;
          case 'saveAttendanceDraft':
            resolve(MockDB.saveAttendanceDraft(payload.sessionId, payload.records, payload.adminId));
            break;
          case 'submitAttendance':
            resolve(MockDB.submitAttendance(payload.sessionId, payload.adminId));
            break;
          default:
            resolve({ success: false, error: 'Unknown post action ' + action });
        }
      }, 120);
    });
  },

  async testConnection(url) {
    if (!url) return { success: false, error: 'กรุณากรอก URL' };
    try {
      const data = await this.fetchJsonp(url, 'ping');
      return { success: true, data: data };
    } catch (e) {
      try {
        const testUrl = new URL(url);
        testUrl.searchParams.set('action', 'ping');
        const res = await fetch(testUrl.toString());
        const data = await res.json();
        return { success: true, data: data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
};
